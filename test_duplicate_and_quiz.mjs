const API_BASE = "http://localhost:5000/api";

async function request(endpoint, options = {}, cookies = "") {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (cookies) headers["Cookie"] = cookies;
  const res = await fetch(url, { ...options, headers });
  const setCookie = res.headers.get("set-cookie") || "";
  let data;
  try { data = await res.json(); } catch (err) { data = { error: "Non-JSON response", status: res.status }; }
  return { status: res.status, data, setCookie };
}

async function run() {
  console.log("=== Testing Duplicate Attempt Submission ===");
  const email = `dup_${Date.now()}@test.com`;
  const reg = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Dup Tester", email, password: "Password123!" })
  });
  const cookie = reg.setCookie;
  const authHeader = reg.data?.token ? { Authorization: `Bearer ${reg.data.token}` } : {};

  await request("/auth/onboarding", {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify({ field: "Computer Science", careerGoal: "Software Developer", level: "Beginner" })
  }, cookie);

  const assessmentId = "6a89e08dea4da156503b6363";
  const start = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: authHeader }, cookie);
  const attemptId = start.data?.attemptId;
  console.log("Started attempt with attemptId:", attemptId);

  const qList = start.data?.assessment?.questions || [];
  const responses = {};
  for (const q of qList) responses[q.id] = "wrong_choice";

  // First submit
  console.log("Sending FIRST submission...");
  const sub1 = await request(`/assessments/${assessmentId}/submit`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ attemptId, responses, elapsedSeconds: 30 })
  }, cookie);
  console.log("Sub 1 status:", sub1.status, "scorePercent:", sub1.data?.scorePercent);

  // Second submit with SAME attemptId (simulating double click or network retry)
  console.log("Sending SECOND submission with same attemptId...");
  const sub2 = await request(`/assessments/${assessmentId}/submit`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ attemptId, responses, elapsedSeconds: 30 })
  }, cookie);
  console.log("Sub 2 status:", sub2.status, "scorePercent:", sub2.data?.scorePercent);

  // Check MistakeMap
  const mm = await request("/mistake-map", { headers: authHeader }, cookie);
  console.log("MistakeMap totalAttempts:", mm.data?.data?.summary?.totalAttempts);
  console.log("MistakeMap totalQuestions:", mm.data?.data?.summary?.totalQuestions);
  console.log("MistakeMap totalMistakes:", mm.data?.data?.summary?.totalMistakes);

  // Check ConceptRoot
  const cr = await request("/concept-root", { headers: authHeader }, cookie);
  console.log("ConceptRoot evidence count:", cr.data?.data?.evidence?.length);
  console.log("ConceptRoot rootCause evidenceCount:", cr.data?.data?.rootCause?.evidenceCount);
}

run().catch(console.error);
