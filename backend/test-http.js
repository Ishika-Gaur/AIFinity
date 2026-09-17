import axios from 'axios';

async function test() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'faizanwer0000@gmail.com',
      password: 'password123'
    });
    
    const cookies = loginRes.headers['set-cookie'];
    console.log('Login successful. Cookies:', cookies);
    
    // 2. Fetch Dashboard
    const dashRes = await axios.get('http://localhost:5000/api/dashboard', {
      headers: {
        Cookie: cookies.join(';')
      }
    });
    console.log('Dashboard status:', dashRes.status);
    console.log('Dashboard data:', Object.keys(dashRes.data));
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

test();
