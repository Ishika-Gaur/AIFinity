import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: 'C:\\Users\\ACER\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', async response => {
    if (response.url().includes('/api/dashboard') || response.url().includes('/api/assessments/personalized')) {
      console.log(`API ${response.url()} response status:`, response.status());
      try {
        const text = await response.text();
        console.log(`API response body:`, text.substring(0, 300));
      } catch (e) {
        console.log('Could not read response body');
      }
    }
  });

  // Set the cookie directly!
  const cookie = {
    name: 'token',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOGExNGQ5MzUzZjhkZjUzZjJiNDlhZiIsImlhdCI6MTc4OTYzMjUxMSwiZXhwIjoxNzg5NzE4OTExfQ.k0LD4QDRU90TWbyZpRDRP7QYscZpxhPW4qzasXbHxVg',
    domain: 'localhost',
    path: '/',
    httpOnly: true
  };
  await page.setCookie(cookie);

  console.log('Navigating to dashboard...');
  try {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch (e) {
    console.log('Navigation timeout or error', e);
  }

  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'dashboard_test.png' });
  console.log('Screenshot saved to dashboard_test.png');

  await browser.close();
})();
