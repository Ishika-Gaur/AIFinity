async function test() {
  try {
    const dashRes = await fetch('http://localhost:5000/api/dashboard', {
      headers: {
        Cookie: 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOGExNGQ5MzUzZjhkZjUzZjJiNDlhZiIsImlhdCI6MTc4OTYzMjUxMSwiZXhwIjoxNzg5NzE4OTExfQ.k0LD4QDRU90TWbyZpRDRP7QYscZpxhPW4qzasXbHxVg'
      }
    });
    console.log('Dashboard status:', dashRes.status);
    const data = await dashRes.json();
    console.log('Dashboard JSON keys:', Object.keys(data));
    if (data.success) {
       console.log('Data keys:', Object.keys(data.data));
    } else {
       console.log('Data error:', data.message);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
