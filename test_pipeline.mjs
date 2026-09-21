const API_BASE = "http://localhost:5000/api";

async function runTest() {
  console.log("1. Registering user...");
  const userStr = `testuser_${Date.now()}@example.com`;
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: userStr,
      password: "Password123!"
    })
  });
  
  // Note: the backend might set cookies or return a token.
  const authCookie = regRes.headers.get('set-cookie');
  console.log("Auth Cookie:", authCookie);
  const regData = await regRes.json();
  console.log("Register Response:", regData);

  const token = regData.token; // If it uses token in response body
  const headers = { 
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(authCookie ? { "Cookie": authCookie } : {})
  };

  console.log("2. Starting Attempt...");
  // Use a generic id to trigger dynamic generation if needed
  const startRes = await fetch(`${API_BASE}/assessments/Computer Science/start`, {
    method: "GET",
    headers
  });
  const startData = await startRes.json();
  console.log("Start Attempt:", startData.success ? "Success" : startData);

  if (!startData.success) {
    console.error("Failed to start attempt");
    return;
  }

  const attemptId = startData.attemptId;
  const assessment = startData.assessment;
  const questions = assessment?.questions || [];

  console.log(`Got ${questions.length} questions`);
  
  console.log("3. Submitting Attempt with deliberate wrong answers...");
  const responses = {};
  const questionResults = [];
  for (const q of questions) {
    // Provide a wrong answer intentionally
    responses[q.id] = "completely_wrong_answer";
    questionResults.push({
      questionId: q.id,
      questionText: q.question,
      type: q.type,
      userAnswer: "completely_wrong_answer",
      correctAnswer: q.answer || "Correct Answer",
      status: "incorrect",
      isCorrect: false,
      marksAwarded: 0,
      maxMarks: 10,
      explanation: "Wrong answer",
      concept: q.concept || "Test Concept",
      topic: q.topic || "Test Topic",
      difficulty: q.difficulty || "Medium",
      mistakeType: "CONCEPTUAL"
    });
  }

  const submitRes = await fetch(`${API_BASE}/assessments/Computer Science/submit`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      attemptId,
      responses,
      elapsedSeconds: 60,
      assessmentTitle: assessment ? assessment.title : "Computer Science Assessment",
      assessmentCategory: assessment ? assessment.category : "Computer Science",
      assessmentField: assessment ? assessment.field : "Computer Science",
      questionResults
    })
  });
  const submitData = await submitRes.json();
  console.log("Submit Response:", submitData.success ? `Score: ${submitData.scorePercent}%` : submitData);

  console.log("4. Fetching Concept Root...");
  const crRes = await fetch(`${API_BASE}/concept-root`, {
    headers
  });
  const crData = await crRes.json();
  
  console.log("================ ConceptRoot Data ================");
  console.log(JSON.stringify(crData, null, 2));
}

runTest().catch(console.error);
