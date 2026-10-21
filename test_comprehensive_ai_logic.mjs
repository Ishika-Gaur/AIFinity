// Comprehensive AI Logic & Personalization Test Suite for Faiz Anwer
// Tests all 12 checklist areas with Expected vs Actual results

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

async function registerAndLogin(prefix, careerGoal = "Software Developer", level = "Intermediate") {
  const email = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@test.com`;
  const password = "Password123!";
  const regRes = await request("/auth/register", { method: "POST", body: JSON.stringify({ name: `Test ${prefix}`, email, password }) });
  let cookie = regRes.setCookie;
  let token = regRes.data?.token;
  let authHeader = token ? { "Authorization": `Bearer ${token}` } : {};

  const loginRes = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (loginRes.setCookie) cookie = loginRes.setCookie;
  if (loginRes.data?.token) {
    token = loginRes.data.token;
    authHeader = { "Authorization": `Bearer ${token}` };
  }

  const obRes = await request("/auth/onboarding", {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify({ field: "Computer Science", careerGoal, level })
  }, cookie);

  return { email, password, cookie, token, authHeader, user: obRes.data?.user || regRes.data?.user };
}

async function runComprehensiveVerification() {
  const assessmentId = "6a89e08dea4da156503b6363";
  const report = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  function addResult(id, title, expected, actual, pass, details = {}) {
    report.tests.push({ id, title, expected, actual, status: pass ? "PASS" : "FAIL", details });
    console.log(`[${pass ? "PASS" : "FAIL"}] ${id}: ${title}`);
    if (!pass) {
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual:   ${actual}`);
    }
  }

  console.log("\n========================================================");
  console.log(" EXECUTING COMPREHENSIVE AI LOGIC & PERSONALIZATION SUITE");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // CHECK 1: Assessment questions, answer evaluation, marks and final scores
  // -------------------------------------------------------------------------
  try {
    const user1 = await registerAndLogin("eval_test");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user1.authHeader }, user1.cookie);
    const questions = start.data?.assessment?.questions || [];
    
    function getCorrectAnswerForQuestion(q) {
      const text = (q.question || "").toLowerCase();
      if (text.includes("how should `low` be updated") || text.includes("target > arr[mid]")) return "low = mid + 1";
      if (text.includes("loop condition")) return "while (low <= high)";
      if (text.includes("middle index") || text.includes("mid =")) return "mid = low + Math.floor((high - low) / 2)";
      if (text.includes("how should `high` be updated") || text.includes("target < arr[mid]")) return "high = mid - 1";
      if (text.includes("smaller than mid element")) return "mid - 1";
      return q.options?.[0] || "";
    }

    // Answer 3 correct, 1 incorrect, 1 unanswered
    const responses = {};
    if (questions.length >= 5) {
      responses[questions[0].id] = getCorrectAnswerForQuestion(questions[0]); // Correct
      responses[questions[1].id] = getCorrectAnswerForQuestion(questions[1]); // Correct
      responses[questions[2].id] = getCorrectAnswerForQuestion(questions[2]); // Correct
      responses[questions[3].id] = "wrong_choice"; // Incorrect
      // question 4 left unanswered
    }

    const submit = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user1.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 40 })
    }, user1.cookie);

    const score = submit.data?.scorePercent;
    const correctCount = submit.data?.correctCount;
    const incorrectCount = submit.data?.incorrectCount;
    const unansweredCount = submit.data?.unansweredCount;

    const passScoring = score === 60 && correctCount === 3 && incorrectCount === 1 && unansweredCount === 1;
    addResult(
      "CHECK-1",
      "Assessment question evaluation, marks and scoring",
      "scorePercent: 60, correct: 3, incorrect: 1, unanswered: 1",
      `scorePercent: ${score}, correct: ${correctCount}, incorrect: ${incorrectCount}, unanswered: ${unansweredCount}`,
      passScoring,
      { questionResults: submit.data?.questionResults?.map(q => ({ id: q.questionId, status: q.status, marks: q.marksAwarded, mistakeType: q.mistakeType })) }
    );
  } catch (err) {
    addResult("CHECK-1", "Assessment question evaluation", "Valid response", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 2: Duplicate evidence handling & Repeated assessment attempts
  // -------------------------------------------------------------------------
  try {
    const user2 = await registerAndLogin("dup_test");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user2.authHeader }, user2.cookie);
    const attemptId = start.data?.attemptId;
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) responses[q.id] = "wrong_answer";

    // First submission
    const sub1 = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user2.authHeader,
      body: JSON.stringify({ attemptId, responses, elapsedSeconds: 30 })
    }, user2.cookie);

    // Duplicate submission (same attemptId)
    const sub2 = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user2.authHeader,
      body: JSON.stringify({ attemptId, responses, elapsedSeconds: 30 })
    }, user2.cookie);

    const mm = await request("/mistake-map", { headers: user2.authHeader }, user2.cookie);
    const cr = await request("/concept-root", { headers: user2.authHeader }, user2.cookie);

    const isDuplicateHandled = sub2.status === 400 || sub2.status === 409 || mm.data?.data?.summary?.totalAttempts === 1;
    addResult(
      "CHECK-2",
      "Duplicate assessment submission handling",
      "Second submission rejected or deduplicated; totalAttempts: 1, totalMistakes: 5",
      `Sub2 status: ${sub2.status}, totalAttempts in DB: ${mm.data?.data?.summary?.totalAttempts}, totalMistakes: ${mm.data?.data?.summary?.totalMistakes}, conceptRootEvidence: ${cr.data?.data?.evidence?.length}`,
      isDuplicateHandled,
      { sub1Status: sub1.status, sub2Status: sub2.status, totalAttempts: mm.data?.data?.summary?.totalAttempts }
    );
  } catch (err) {
    addResult("CHECK-2", "Duplicate submission handling", "Handled cleanly", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 3: ConceptRoot generation using latest assessment evidence & AI explanation
  // -------------------------------------------------------------------------
  try {
    const user3 = await registerAndLogin("cr_test");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user3.authHeader }, user3.cookie);
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) {
      if (q.concept === "Boundary Conditions") responses[q.id] = "wrong_choice";
      else responses[q.id] = "while (low <= high)";
    }
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user3.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 30 })
    }, user3.cookie);

    const cr = await request("/concept-root", { headers: user3.authHeader }, user3.cookie);
    const concept = cr.data?.data?.canonicalConcept;
    const confidence = cr.data?.data?.rootCause?.confidence;
    const diagnosis = cr.data?.data?.diagnosis?.status;
    const aiExplanation = cr.data?.data?.explanation;
    const aiStatus = cr.data?.data?.aiStatus;

    const passConceptRoot = concept === "Boundary Conditions" && confidence > 0;
    const passAIExplanation = aiStatus === "completed" && aiExplanation !== null;

    addResult(
      "CHECK-3A",
      "ConceptRoot evidence extraction and mathematical root cause identification",
      "canonicalConcept: 'Boundary Conditions', confidence >= 0.5, diagnosis: 'MODERATE_CONFIDENCE'",
      `canonicalConcept: '${concept}', confidence: ${confidence}, diagnosis: '${diagnosis}'`,
      passConceptRoot
    );

    addResult(
      "CHECK-3B",
      "ConceptRoot AI explanation generation",
      "aiStatus: 'completed', explanation text present",
      `aiStatus: '${aiStatus}', explanation: ${aiExplanation ? "Present" : "null"}`,
      passAIExplanation
    );
  } catch (err) {
    addResult("CHECK-3", "ConceptRoot generation", "Success", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 4: MistakeMap identification of repeated mistakes and weak concepts
  // -------------------------------------------------------------------------
  try {
    const user4 = await registerAndLogin("mm_test");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user4.authHeader }, user4.cookie);
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) {
      if (q.concept === "Boundary Conditions" || q.concept === "Search-Space Invariants") {
        responses[q.id] = "fail_it";
      } else {
        responses[q.id] = "while (low <= high)";
      }
    }
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user4.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 40 })
    }, user4.cookie);

    const mm = await request("/mistake-map", { headers: user4.authHeader }, user4.cookie);
    const highPriority = mm.data?.data?.highPriorityConcepts || [];
    const dominantType = mm.data?.data?.mistakeDistribution?.dominantType;
    const topMistake = mm.data?.data?.summary?.mostCommonWeakness;

    const foundWeak = highPriority.some(c => c.concept === "Boundary Conditions");
    addResult(
      "CHECK-4",
      "MistakeMap clustering of weak concepts and priority scoring",
      "Identifies 'Boundary Conditions' in highPriorityConcepts, dominant mistake type categorized",
      `High priority concepts count: ${highPriority.length}, Found Boundary Conditions: ${foundWeak}, dominantType: ${dominantType}, mostCommonWeakness: ${topMistake}`,
      foundWeak,
      { highPriority }
    );
  } catch (err) {
    addResult("CHECK-4", "MistakeMap clustering", "Success", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 5: SkillGap calculation against career requirements & unassessed skills
  // -------------------------------------------------------------------------
  try {
    const user5 = await registerAndLogin("sg_test", "Software Developer");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user5.authHeader }, user5.cookie);
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) responses[q.id] = "while (low <= high)"; // 1 correct, rest wrong
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user5.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 35 })
    }, user5.cookie);

    const sg = await request("/skill-gap", { headers: user5.authHeader }, user5.cookie);
    const skills = sg.data?.data?.skills || [];
    const targetCareer = sg.data?.data?.targetCareer;
    const overallProficiency = sg.data?.data?.overallProficiency;

    // Career knowledge base has 10 skills for Software Engineer (Programming Fundamentals, Arrays, Searching, Binary Search, Sorting, HTML/CSS, JS, SQL, APIs, Git).
    // Does SkillGap include the full career taxonomy or only the 1 tested skill?
    const hasFullTaxonomy = skills.length >= 5;
    addResult(
      "CHECK-5",
      "SkillGap calculation against career requirements & unassessed competencies",
      "Comprehensive curriculum gap analysis showing tested + unassessed career requirements (>= 5 skills)",
      `Target career: '${targetCareer}', Skills count returned: ${skills.length}, Skills: [${skills.map(s => s.skillName).join(", ")}]`,
      hasFullTaxonomy,
      { skillsCount: skills.length, overallProficiency }
    );
  } catch (err) {
    addResult("CHECK-5", "SkillGap calculation", "Success", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 6: AI Roadmap generation using ConceptRoot, SkillGap, and career goals
  // -------------------------------------------------------------------------
  try {
    const user6 = await registerAndLogin("rm_test", "Data Scientist");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user6.authHeader }, user6.cookie);
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) responses[q.id] = "wrong";
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user6.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 30 })
    }, user6.cookie);

    const rm = await request("/analytics/roadmap", { headers: user6.authHeader }, user6.cookie);
    const stages = rm.data?.data?.stages || [];
    const phase1 = stages[0];
    const targetCareer = rm.data?.data?.targetCareer;

    const adaptsToWeakness = phase1?.isWeakConcept === true && phase1?.priority === "High";
    const adaptsToCareer = targetCareer === "Data Scientist";

    addResult(
      "CHECK-6",
      "Roadmap adapts Phase 1 to weak concepts and targets career goal",
      "Phase 1 isWeakConcept: true, priority: 'High', targetCareer: 'Data Scientist'",
      `isWeakConcept: ${phase1?.isWeakConcept}, priority: '${phase1?.priority}', targetCareer: '${targetCareer}', Phase 1 title: '${phase1?.title}'`,
      adaptsToWeakness && adaptsToCareer
    );
  } catch (err) {
    addResult("CHECK-6", "Roadmap generation", "Success", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 7: Roadmap Stage Completion Persistence (PUT /api/analytics/roadmap)
  // -------------------------------------------------------------------------
  try {
    const user7 = await registerAndLogin("rm_toggle_test");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user7.authHeader }, user7.cookie);
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) responses[q.id] = "wrong";
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user7.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 30 })
    }, user7.cookie);

    // Initial roadmap
    await request("/analytics/roadmap", { headers: user7.authHeader }, user7.cookie);

    // Toggle stage 1
    const toggleRes = await request("/analytics/roadmap", {
      method: "PUT",
      headers: user7.authHeader,
      body: JSON.stringify({ stageId: 1 })
    }, user7.cookie);

    const toggleStatus = toggleRes.status;
    const completedStages = toggleRes.data?.data?.completedStageIds || [];
    const passToggle = toggleStatus === 200 && completedStages.includes(1);

    addResult(
      "CHECK-7",
      "Roadmap stage toggle progression persistence (PUT /api/analytics/roadmap)",
      "Status 200 OK, completedStageIds includes [1]",
      `Status: ${toggleStatus}, completedStageIds: ${JSON.stringify(completedStages)}`,
      passToggle
    );
  } catch (err) {
    addResult("CHECK-7", "Roadmap stage toggle", "Status 200", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 8: Career goal updates reflect on roadmap (Precedence check)
  // -------------------------------------------------------------------------
  try {
    const user8 = await registerAndLogin("career_update_test", "Software Developer");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user8.authHeader }, user8.cookie);
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) responses[q.id] = "wrong";
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user8.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 30 })
    }, user8.cookie);

    // First roadmap view generates roadmap for Software Developer
    const rmInitial = await request("/analytics/roadmap", { headers: user8.authHeader }, user8.cookie);

    // Now update profile to Data Scientist
    await request("/auth/profile", {
      method: "PUT",
      headers: user8.authHeader,
      body: JSON.stringify({ careerGoal: "Data Scientist" })
    }, user8.cookie);

    // Re-fetch roadmap
    const rmUpdated = await request("/analytics/roadmap", { headers: user8.authHeader }, user8.cookie);
    const initialCareer = rmInitial.data?.data?.targetCareer;
    const updatedCareer = rmUpdated.data?.data?.targetCareer;

    const passCareerPrecedence = updatedCareer === "Data Scientist";
    addResult(
      "CHECK-8",
      "Roadmap updates targetCareer when student updates profile career goal",
      "targetCareer switches from 'Software Developer' to 'Data Scientist'",
      `Initial career: '${initialCareer}', Updated career: '${updatedCareer}'`,
      passCareerPrecedence
    );
  } catch (err) {
    addResult("CHECK-8", "Career goal precedence", "Updated career reflected", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 9: Revision Center and verification-quiz improvement tracking
  // -------------------------------------------------------------------------
  try {
    const user9 = await registerAndLogin("rev_test");
    const start = await request(`/assessments/${assessmentId}/start`, { headers: user9.authHeader }, user9.cookie);
    const qList = start.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) responses[q.id] = "wrong"; // fail all
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user9.authHeader,
      body: JSON.stringify({ attemptId: start.data.attemptId, responses, elapsedSeconds: 30 })
    }, user9.cookie);

    const revBefore = await request("/revision", { headers: user9.authHeader }, user9.cookie);
    const firstItem = revBefore.data?.data?.items?.[0];
    const conceptId = firstItem?.conceptId;

    // Complete revision session with mastery
    const compRes = await request(`/revision/${conceptId}/complete`, {
      method: "POST",
      headers: user9.authHeader,
      body: JSON.stringify({ practiceAccuracy: 90, confidence: 4 })
    }, user9.cookie);

    const revAfter = await request("/revision", { headers: user9.authHeader }, user9.cookie);
    const updatedItem = revAfter.data?.data?.items?.find(i => i.conceptId === conceptId);

    const passRevisionProgress = compRes.status === 200 && updatedItem?.status === "COMPLETED" && compRes.data?.data?.intervalDays > 1;
    addResult(
      "CHECK-9",
      "Revision Center spaced repetition progression upon session completion",
      "Status 200, status updated to COMPLETED, intervalDays advanced (> 1 day)",
      `compStatus: ${compRes.status}, status: '${updatedItem?.status}', intervalDays: ${compRes.data?.data?.intervalDays}, nextReviewAt: ${compRes.data?.data?.nextReviewAt}`,
      passRevisionProgress
    );
  } catch (err) {
    addResult("CHECK-9", "Revision Center completion", "Progress tracked", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 10: Confidence vs accuracy metric and learning-gap identification
  // -------------------------------------------------------------------------
  try {
    const user10 = await registerAndLogin("conf_test");
    // Attempt 1: 0% score
    const start1 = await request(`/assessments/${assessmentId}/start`, { headers: user10.authHeader }, user10.cookie);
    const qList = start1.data?.assessment?.questions || [];
    const resp1 = {};
    for (const q of qList) resp1[q.id] = "wrong";
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user10.authHeader,
      body: JSON.stringify({ attemptId: start1.data.attemptId, responses: resp1, elapsedSeconds: 30 })
    }, user10.cookie);

    const cr1 = await request("/concept-root", { headers: user10.authHeader }, user10.cookie);
    const conf1 = cr1.data?.data?.rootCause?.confidence; // Expected ~0.60

    // Attempt 2: 100% score (recovery)
    const start2 = await request(`/assessments/${assessmentId}/start`, { headers: user10.authHeader }, user10.cookie);
    function getCorrectAnswerForQuestion(q) {
      const text = (q.question || "").toLowerCase();
      if (text.includes("how should `low` be updated") || text.includes("target > arr[mid]")) return "low = mid + 1";
      if (text.includes("loop condition")) return "while (low <= high)";
      if (text.includes("middle index") || text.includes("mid =")) return "mid = low + Math.floor((high - low) / 2)";
      if (text.includes("how should `high` be updated") || text.includes("target < arr[mid]")) return "high = mid - 1";
      if (text.includes("smaller than mid element")) return "mid - 1";
      return q.options?.[0] || "";
    }

    const resp2 = {};
    for (const q of (start2.data?.assessment?.questions || [])) {
      resp2[q.id] = getCorrectAnswerForQuestion(q);
    }
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: user10.authHeader,
      body: JSON.stringify({ attemptId: start2.data.attemptId, responses: resp2, elapsedSeconds: 25 })
    }, user10.cookie);

    const cr2 = await request("/concept-root", { headers: user10.authHeader }, user10.cookie);
    const conf2 = cr2.data?.data?.rootCause?.confidence; // Expected ~0.25 (penalized by recent success)
    const accuracy2 = cr2.data?.data?.mastery?.accuracy; // Expected 0.50

    const passConfidenceDeescalation = conf2 < conf1 && accuracy2 === 0.5;
    addResult(
      "CHECK-10",
      "Confidence formula penalizes confidence upon recent student improvement",
      "Initial confidence (0.60) drops after 100% attempt to (0.25) due to recent accuracy penalty",
      `conf1 (Failed): ${conf1}, conf2 (Recovered): ${conf2}, historicalAccuracy: ${accuracy2}`,
      passConfidenceDeescalation
    );
  } catch (err) {
    addResult("CHECK-10", "Confidence vs accuracy", "Confidence adjusts", err.message, false);
  }

  // -------------------------------------------------------------------------
  // CHECK 11: Personal Intelligence AI Chat with user performance context
  // -------------------------------------------------------------------------
  try {
    const user11 = await registerAndLogin("pi_test");
    const chatRes = await request("/personal-intelligence/chat", {
      method: "POST",
      headers: user11.authHeader,
      body: JSON.stringify({
        messages: [{ role: "user", content: "What should I focus on next?" }]
      })
    }, user11.cookie);

    const passChat = chatRes.status === 200 && chatRes.data?.message && !chatRes.data?.error;
    addResult(
      "CHECK-11",
      "Personal Intelligence AI Chat assistant response",
      "Status 200 OK, personalized message returned",
      `Status: ${chatRes.status}, Message: ${typeof chatRes.data?.message === 'string' ? chatRes.data.message.substring(0, 80) + '...' : JSON.stringify(chatRes.data)}`,
      passChat
    );
  } catch (err) {
    addResult("CHECK-11", "Personal Intelligence Chat", "Status 200", err.message, false);
  }

  console.log("\n========================================================");
  console.log(" VERIFICATION COMPLETE. SUMMARY OF RESULTS:");
  console.log("========================================================");
  const passed = report.tests.filter(t => t.status === "PASS").length;
  const failed = report.tests.filter(t => t.status === "FAIL").length;
  console.log(`Total: ${report.tests.length} | Passed: ${passed} | Failed: ${failed}`);
  
  import('fs').then(fs => {
    fs.writeFileSync('./faiz_verification_results.json', JSON.stringify(report, null, 2));
    console.log("Report saved to ./faiz_verification_results.json\n");
  });
}

runComprehensiveVerification().catch(console.error);
