

async function test() {
  // Login to get token
  console.log("Logging in...");
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faizanwer0000@gmail.com', password: 'password123' })
  });
  
  if (!loginRes.ok) {
    console.error("Login failed!", loginRes.status, await loginRes.text());
    return;
  }
  
  const cookies = loginRes.headers.get('set-cookie');
  console.log("Cookies:", cookies);
  
  console.log("Fetching dashboard...");
  const dashRes = await fetch('http://localhost:5000/api/dashboard', {
    headers: {
      'Cookie': cookies
    }
  });
  
  const text = await dashRes.text();
  console.log("Dashboard response status:", dashRes.status);
  console.log("Dashboard response:", text.substring(0, 500));
}

test();
