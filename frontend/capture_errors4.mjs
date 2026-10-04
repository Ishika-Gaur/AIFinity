import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', (err) => {
    console.error('PAGE_ERROR:', err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('CONSOLE_ERROR:', msg.text());
    }
  });

  const checkBlank = async (url, name) => {
    console.log("Visiting " + name + "...");
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const isEmpty = await page.evaluate(() => {
      const root = document.getElementById('root');
      return !root || root.innerHTML.trim() === '';
    });
    if (isEmpty) {
      console.error(">>> " + name + " IS BLANK!");
    } else {
      console.log(">>> " + name + " renders fine.");
    }
  };

  try {
    await checkBlank('http://localhost:5173/', 'Root (Logged Out)');

    // Login
    console.log("Registering/Logging in...");
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle2' });
    await page.type('input[name="name"]', 'Test User3');
    await page.type('input[name="email"]', 'test3_' + Date.now() + '@example.com');
    await page.type('input[name="password"]', 'Password123!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    
    const isEmptyDash = await page.evaluate(() => {
      const root = document.getElementById('root');
      return !root || root.innerHTML.trim() === '';
    });
    if (isEmptyDash) console.error(">>> Dashboard IS BLANK!");
    else console.log(">>> Dashboard renders fine.");

    await checkBlank('http://localhost:5173/courses', '/courses');
    await checkBlank('http://localhost:5173/revision', '/revision');
    
  } catch (e) {
    console.error("Test error:", e);
  } finally {
    await browser.close();
  }
})();
