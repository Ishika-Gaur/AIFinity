import { spawn } from 'child_process';
import { chromium } from 'playwright';

(async () => {
  console.log("Starting backend...");
  const backend = spawn('npm', ['run', 'dev'], { cwd: 'backend', shell: true });
  backend.stdout.on('data', d => process.stdout.write('BE: ' + d.toString()));
  backend.stderr.on('data', d => process.stdout.write('BE_ERR: ' + d.toString()));
  
  console.log("Starting frontend...");
  const frontend = spawn('npm', ['run', 'dev'], { cwd: 'frontend', shell: true });
  frontend.stdout.on('data', d => process.stdout.write('FE: ' + d.toString()));
  frontend.stderr.on('data', d => process.stdout.write('FE_ERR: ' + d.toString()));

  console.log("Waiting 20 seconds for servers to start...");
  await new Promise(r => setTimeout(r, 20000));

  console.log("Launching browser with Playwright...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', response => {
     if (response.url().includes('/api/')) {
        console.log(`<< ${response.status()} ${response.url()}`);
     }
  });
  
  page.on('console', msg => {
     if (msg.type() === 'error' || msg.text().includes('fetch') || msg.text().includes('ConceptRoot')) {
        console.log(`BROWSER_CONSOLE: ${msg.text()}`);
     }
  });
  
  try {
    // 1. Register/Login
    console.log("Registering user...");
    await page.goto('http://localhost:5173/signup');
    await page.waitForTimeout(1000);
    // Assuming inputs are standard, let's try broader selectors
    await page.fill('input[type="text"], input[name="name"]', 'Browser Test User');
    const uniqueEmail = `browser_${Date.now()}@test.com`;
    await page.fill('input[type="email"], input[name="email"]', uniqueEmail);
    await page.fill('input[type="password"], input[name="password"]', 'Password123!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    console.log("Updating user in DB to bypass onboarding...");
    const { MongoClient } = await import('mongodb');
    const uri = "mongodb+srv://amanyt27082005_db_user:mlBv42m94lekLwwv@namastenode.ompokw3.mongodb.net/aifinity";
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('aifinity');
    await db.collection('users').updateOne(
       { email: uniqueEmail },
       { $set: { onboardingCompleted: true, selectedField: "Computer Science" } }
    );
    await client.close();
    
    // Also patch the localStorage user cache so the frontend doesn't redirect us!
    await page.evaluate(() => {
        try {
           let u = JSON.parse(localStorage.getItem("aifinity_student_user") || "{}");
           u.onboardingCompleted = true;
           u.selectedField = "Computer Science";
           localStorage.setItem("aifinity_student_user", JSON.stringify(u));
        } catch(e) {}
    });

    await page.reload();
    await page.waitForTimeout(2000);
    
    // 2. Go to Assessment
    console.log("Navigating to Assessment...");
    await page.goto('http://localhost:5173/assessment/6a89bd72eefed8ee78475f0d');
    await page.waitForTimeout(3000);
    
    // Check if we need to click "Start Assessment"
    const startBtn = page.locator('button', { hasText: 'Start Assessment' });
    if (await startBtn.count() > 0) {
        console.log("Found Start Assessment button, clicking it.");
        await startBtn.first().click();
        await page.waitForTimeout(3000);
    }
    // 3. Answer questions
    console.log("Answering questions...");
    let attemptCount = 0;
    while(attemptCount < 20) {
        console.log(`Attempt ${attemptCount}...`);
        
        // Pick any visible option
        const options = page.locator('div.cursor-pointer, input[type="radio"], button[aria-pressed]');
        if (await options.count() > 0) {
            await options.first().click({ force: true });
            await page.waitForTimeout(500);
        }
        
        // Find buttons
        const btnTexts = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent));
        console.log("Available buttons:", btnTexts);
        
        const nextBtn = page.locator('button', { hasText: 'Next' });
        const submitBtn = page.locator('button', { hasText: 'Submit' });
        const finishBtn = page.locator('button', { hasText: 'Finish' });
        
        if (await submitBtn.count() > 0) {
            await submitBtn.first().click();
            console.log("Clicked Submit!");
            await page.waitForTimeout(4000);
            break;
        } else if (await finishBtn.count() > 0) {
            await finishBtn.first().click();
            console.log("Clicked Finish!");
            await page.waitForTimeout(4000);
            break;
        } else if (await nextBtn.count() > 0) {
            await nextBtn.first().click();
            console.log("Clicked Next");
        } else {
            console.log("No Next/Submit found. Checking for summary.");
            const summary = await page.$('text=Summary');
            if (summary) break;
            const evalText = page.locator('text="Evaluating"');
            if (await evalText.count() > 0) {
                console.log("Evaluating...");
                break;
            }
        }
        await page.waitForTimeout(1000);
        attemptCount++;
    }
    
    console.log("Waiting for submission to process...");
    await page.waitForSelector('text=Assessment Completed!', { timeout: 30000 });
    console.log("Submission processed successfully!");

    // 4. Open ConceptRoot
    console.log("Navigating to ConceptRoot...");
    await page.goto('http://localhost:5173/concept-root');
    await page.waitForTimeout(15000); // Wait for Gemini

    const debugResponse = await page.evaluate(async () => {
        try {
            const r = await fetch("http://localhost:5000/api/concept-root", { credentials: "include" });
            const txt = await r.text();
            return `STATUS: ${r.status}, BODY: ${txt}`;
        } catch(e) {
            return `FETCH ERR: ${e.message}`;
        }
    });
    console.log("DEBUG /api/concept-root:", debugResponse);

    // Extract diagnostic info
    console.log("Extracting diagnostic info...");
    const html = await page.evaluate(() => document.body.innerHTML);
    
    if (html.includes('No ConceptRoot Data Yet')) {
        console.log("VERIFICATION FAILED: 'No ConceptRoot Data Yet' is visible.");
    } else if (html.includes('Not enough evidence yet') || html.includes('TENTATIVE')) {
        console.log("PARTIAL: Insufficient evidence shown.");
    }
    
    if (html.includes('How to think about it next time') || html.includes('Concept:')) {
        console.log("VERIFIED: Full diagnostic found in DOM.");
    }
    
    // Grab all text content
    const textContent = await page.evaluate(() => document.body.innerText);
    console.log("=== ConceptRoot Text ===");
    console.log(textContent.substring(0, 3000));
    
  } catch(e) {
    console.error("Test script failed:", e);
  } finally {
    await browser.close();
    backend.kill();
    frontend.kill();
    process.exit(0);
  }
})();
