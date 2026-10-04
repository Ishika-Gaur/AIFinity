import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', (err) => {
    console.error('PAGE_ERROR:', err.message);
    errors.push('PAGE_ERROR: ' + err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('CONSOLE_ERROR:', msg.text());
      errors.push('CONSOLE_ERROR: ' + msg.text());
    }
  });

  try {
    // 1. Visit root to see if it's blank BEFORE logging in
    console.log("Visiting root...");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    let html = await page.evaluate(() => document.body.innerHTML);
    if (!html.includes('<div')) console.log("Root is blank!");

    // 2. Register/Login
    console.log("Registering to log in...");
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle2' });
    await page.type('input[name="name"]', 'Test User2');
    await page.type('input[name="email"]', 'test2_' + Date.now() + '@example.com');
    await page.type('input[name="password"]', 'Password123!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    console.log("Logged in!");

    await new Promise(r => setTimeout(r, 2000));

    // Check dashboard html
    html = await page.evaluate(() => document.body.innerHTML);
    if (!html.includes('<div')) console.log("Dashboard is blank!");
    
    // 3. Visit /courses
    console.log("Visiting /courses...");
    await page.goto('http://localhost:5173/courses', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    html = await page.evaluate(() => document.body.innerHTML);
    if (!html.includes('<div')) console.log("/courses is blank!");

    // 4. Visit /revision
    console.log("Visiting /revision...");
    await page.goto('http://localhost:5173/revision', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    html = await page.evaluate(() => document.body.innerHTML);
    if (!html.includes('<div')) console.log("/revision is blank!");
    
  } catch (e) {
    console.error("Test error:", e);
  } finally {
    await browser.close();
  }
})();
