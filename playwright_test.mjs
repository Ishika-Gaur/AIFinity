import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser with Playwright...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 1. Register/Login
    console.log("Registering user...");
    await page.goto('http://localhost:5174/register');
    await page.fill('input[name="name"]', 'Browser Test User');
    const uniqueEmail = `browser_${Date.now()}@test.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    console.log("Handling onboarding if present...");
    if (page.url().includes('onboarding')) {
       const buttons = await page.$$('button');
       for(let b of buttons) {
          const text = await b.textContent();
          if(text.includes('Start') || text.includes('Next') || text.includes('Skip') || text.includes('Complete')) {
             await b.click();
             await page.waitForTimeout(1000);
          }
       }
    }
    
    // 2. Go to Assessment
    console.log("Navigating to assessments...");
    await page.goto('http://localhost:5174/assessments');
    await page.waitForTimeout(3000);
    
    // Look for a link or button that has 'Computer Science' or 'Start'
    const startButtons = await page.$$('button');
    let clickedStart = false;
    for(let b of startButtons) {
        const text = await b.textContent();
        if(text && (text.includes('Start') || text.includes('Take') || text.includes('Assessment'))) {
            await b.click();
            clickedStart = true;
            break;
        }
    }

    if(!clickedStart) {
       await page.goto('http://localhost:5174/assessments/Computer%20Science/attempt');
    }
    
    await page.waitForTimeout(2000);
    
    // 3. Answer questions (deliberately wrong)
    console.log("Answering questions...");
    const inputs = await page.$$('input[type="radio"]');
    if (inputs.length > 0) {
        while (true) {
            const nextBtns = await page.$$('button');
            let nextBtn = null;
            let isSubmit = false;
            for(let b of nextBtns) {
               const txt = await b.textContent();
               if(txt && txt.includes('Next')) { nextBtn = b; break; }
               if(txt && txt.includes('Submit')) { nextBtn = b; isSubmit = true; break; }
            }
            if (nextBtn) {
                const visibleRadios = await page.$$('input[type="radio"]');
                if(visibleRadios.length > 0) {
                    await visibleRadios[0].click();
                }
                await nextBtn.click();
                await page.waitForTimeout(1000);
                if (isSubmit) break;
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
    await page.waitForTimeout(5000); // Wait for Gemini

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
