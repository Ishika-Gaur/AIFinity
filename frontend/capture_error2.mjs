import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new'
  });
  const page = await browser.newPage();
  
  page.on('pageerror', (err) => {
    console.error('PAGE_ERROR:', err.message);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('CONSOLE_ERROR:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173/revision', { waitUntil: 'networkidle2', timeout: 10000 });
    const html = await page.evaluate(() => document.body.innerHTML);
    console.log("HTML:", html.substring(0, 500));
  } catch (e) {
    console.log('Navigation error:', e.message);
  }
  
  await browser.close();
})();
