import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('pageerror', (err) => console.error('PAGE_ERROR:', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE_ERROR:', msg.text());
  });

  try {
    console.log("Visiting /courses...");
    await page.goto('http://localhost:5173/courses', { waitUntil: 'networkidle2' });
    let html = await page.evaluate(() => document.body.innerHTML);
    if (!html.includes('<div')) console.log("Blank body on /courses!");
    else console.log("/courses loaded OK. First 50 chars:", html.substring(0, 50));
    
    console.log("Visiting /revision...");
    await page.goto('http://localhost:5173/revision', { waitUntil: 'networkidle2' });
    html = await page.evaluate(() => document.body.innerHTML);
    if (!html.includes('<div')) console.log("Blank body on /revision!");
    else console.log("/revision loaded OK. First 50 chars:", html.substring(0, 50));

  } catch (e) {
    console.error("Test error:", e);
  } finally {
    await browser.close();
  }
})();
