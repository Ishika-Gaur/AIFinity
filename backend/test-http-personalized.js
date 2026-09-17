async function test() {
  try {
    const dashRes = await fetch('http://localhost:5000/api/assessments/personalized', {
      headers: {
        Cookie: 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOGExNGQ5MzUzZjhkZjUzZjJiNDlhZiIsImlhdCI6MTc4OTYzMjUxMSwiZXhwIjoxNzg5NzE4OTExfQ.k0LD4QDRU90TWbyZpRDRP7QYscZpxhPW4qzasXbHxVg'
      }
    });
    console.log('API status:', dashRes.status);
    const data = await dashRes.json();
    console.log('API JSON:', JSON.stringify(data).substring(0, 200));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
