import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', (err) => errors.push('PAGE_ERROR: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('401')) {
      errors.push('CONSOLE_ERROR: ' + msg.text());
    }
  });

  try {
    // 1. Register/Login
    console.log("Registering to log in...");
    await page.goto('http://localhost:5173/signup');
    await page.type('input[name="name"]', 'Test User');
    await page.type('input[name="email"]', 'test_' + Date.now() + '@example.com');
    await page.type('input[name="password"]', 'Password123!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    console.log("Logged in!");

    // 2. Wait a bit on Dashboard
    await new Promise(r => setTimeout(r, 2000));

    // 3. Visit /courses
    console.log("Visiting /courses...");
    await page.goto('http://localhost:5173/courses', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // 4. Visit /revision
    console.log("Visiting /revision...");
    await page.goto('http://localhost:5173/revision', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    console.log("Errors caught:", errors);
  } catch (e) {
    console.error("Test error:", e);
  } finally {
    await browser.close();
  }
})();
