import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ 
    headless: 'new',
    executablePath: "C:\\Users\\ACER\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe"
  });
  const page = await browser.newPage();
  
  try {
    // 1. Register/Login
    console.log("Registering user...");
    await page.goto('http://localhost:5174/register');
    await page.type('input[name="name"]', 'Browser Test User');
    const uniqueEmail = `browser_${Date.now()}@test.com`;
    await page.type('input[name="email"]', uniqueEmail);
    await page.type('input[name="password"]', 'Password123!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    
    // We should be redirected to onboarding or dashboard
    console.log("Handling onboarding if present...");
    if (page.url().includes('onboarding')) {
       // Skip or fill onboarding - wait, the UI might need clicking
       const buttons = await page.$$('button');
       for(let b of buttons) {
          const text = await page.evaluate(el => el.textContent, b);
          if(text.includes('Start') || text.includes('Next') || text.includes('Skip') || text.includes('Complete')) {
             await b.click();
             await page.waitForTimeout(1000);
          }
       }
    }
    
    // 2. Go to Assessment
    console.log("Navigating to assessments...");
    await page.goto('http://localhost:5174/assessments');
    await page.waitForSelector('.assessment-card, button, a', { timeout: 5000 }).catch(e => console.log(e));
    
    // Look for a link or button that has 'Computer Science' or 'Start'
    const startButtons = await page.$$('button');
    let clickedStart = false;
    for(let b of startButtons) {
        const text = await page.evaluate(el => el.textContent, b);
        if(text.includes('Start') || text.includes('Take') || text.includes('Assessment')) {
            await b.click();
            clickedStart = true;
            break;
        }
    }

    if(!clickedStart) {
       // Just directly navigate if we can't find the button
       await page.goto('http://localhost:5174/assessments/Computer%20Science/attempt');
    }
    
    await page.waitForTimeout(2000);
    
    // 3. Answer questions (deliberately wrong)
    console.log("Answering questions...");
    // Find radio buttons or inputs
    const inputs = await page.$$('input[type="radio"]');
    if (inputs.length > 0) {
        // Just click the first option for each question
        let currentQuestion = 1;
        while (true) {
            const nextBtn = await page.$x("//button[contains(text(), 'Next') or contains(text(), 'Submit')]");
            if (nextBtn.length > 0) {
                // Click a random radio
                const visibleRadios = await page.$$('input[type="radio"]');
                if(visibleRadios.length > 0) {
                    await visibleRadios[0].click();
                }
                const btnText = await page.evaluate(el => el.textContent, nextBtn[nextBtn.length - 1]);
                await nextBtn[nextBtn.length - 1].click();
                await page.waitForTimeout(1000);
                if (btnText.includes('Submit')) break;
            } else {
                break;
            }
        }
    }

    // Wait for submission to complete and redirect
    console.log("Waiting for submission...");
    await page.waitForTimeout(3000);

    // 4. Open ConceptRoot
    console.log("Navigating to ConceptRoot...");
    await page.goto('http://localhost:5174/concept-root');
    await page.waitForTimeout(5000); // Give it time to load from backend and Gemini

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
    console.log(textContent.substring(0, 2000));
    
  } catch(e) {
    console.error("Test script failed:", e);
  } finally {
    await browser.close();
  }
})();
