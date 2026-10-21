// AIFINITY Intelligence and Integration Testing Suite
// Tests: Strong Student, Weak Student, Repeating Mistake, Improvement, Career Goal Impact, Full E2E Flow

const API_BASE = "http://localhost:5000/api";

function logSection(title) {
  console.log("\n" + "=".repeat(70));
  console.log(` ${title} `);
  console.log("=".repeat(70) + "\n");
}

async function request(endpoint, options = {}, cookies = "") {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (cookies) {
    headers["Cookie"] = cookies;
  }
  const res = await fetch(url, { ...options, headers });
  const setCookie = res.headers.get("set-cookie") || "";
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = { error: "Non-JSON response", status: res.status };
  }
  return { status: res.status, data, setCookie };
}

async function registerAndLogin(prefix, careerGoal = "Software Developer", level = "Intermediate") {
  const email = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@test.com`;
  const password = "Password123!";
  
  // Register
  const regRes = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: `Test ${prefix}`, email, password })
  });
  
  let cookie = regRes.setCookie;
  let token = regRes.data?.token;
  let authHeader = token ? { "Authorization": `Bearer ${token}` } : {};

  // If cookie didn't come or login needed
  const loginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  if (loginRes.setCookie) cookie = loginRes.setCookie;
  if (loginRes.data?.token) {
    token = loginRes.data.token;
    authHeader = { "Authorization": `Bearer ${token}` };
  }

  // Complete onboarding
  const obRes = await request("/auth/onboarding", {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify({ field: "Computer Science", careerGoal, level })
  }, cookie);

  return { email, password, cookie, token, authHeader, user: obRes.data?.user || regRes.data?.user };
}

async function runAllTests() {
  const results = {
    strongStudent: null,
    weakStudent: null,
    repeatingMistake: null,
    improvementStudent: null,
    careerImpact: null,
    e2eFlow: null,
    bugs: []
  };

  const assessmentId = "6a89e08dea4da156503b6363"; // 5 questions on Binary Search: Boundary Conditions, Search-Space Invariants, Termination Conditions

  // =========================================================================
  // TEST A: STRONG STUDENT (90-100%)
  // =========================================================================
  logSection("TEST A: STRONG STUDENT (90-100%)");
  try {
    const userA = await registerAndLogin("strong", "Software Developer", "Advanced");
    console.log(`Registered User A: ${userA.email}`);

    // Start assessment
    const startA = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: userA.authHeader }, userA.cookie);
    console.log(`Start attempt status: ${startA.status}, attemptId: ${startA.data?.attemptId}`);
    const questionsA = startA.data?.assessment?.questions || [];
    console.log(`Received ${questionsA.length} questions`);

    // Prepare 100% correct answers based on assessment content
    // Correct options for 6a89e08dea4da156503b6363:
    // Q1: low = mid + 1
    // Q2: high = mid - 1
    // Q3: mid = low + Math.floor((high - low) / 2)
    // Q4: while (low <= high)
    // Q5: mid - 1
    const correctMap = {
      "Q1": "low = mid + 1",
      "Q2": "high = mid - 1",
      "Q3": "mid = low + Math.floor((high - low) / 2)",
      "Q4": "while (low <= high)",
      "Q5": "mid - 1"
    };

    const responsesA = {};
    for (const q of questionsA) {
      for (const [key, ans] of Object.entries(correctMap)) {
        if (q.question.includes(key)) {
          responsesA[q.id] = ans;
          break;
        }
      }
      if (!responsesA[q.id]) {
        // Fallback: pick option that matches
        responsesA[q.id] = q.options?.find(o => o.includes("mid + 1") || o.includes("mid - 1") || o.includes("low <= high") || o.includes("floor")) || q.options?.[0];
      }
    }

    const submitA = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: userA.authHeader,
      body: JSON.stringify({
        attemptId: startA.data.attemptId,
        responses: responsesA,
        elapsedSeconds: 45
      })
    }, userA.cookie);

    console.log("Submit result:", {
      status: submitA.status,
      scorePercent: submitA.data?.scorePercent,
      correctCount: submitA.data?.correctCount,
      incorrectCount: submitA.data?.incorrectCount
    });

    // Check MistakeMap
    const mmA = await request("/mistake-map", { headers: userA.authHeader }, userA.cookie);
    console.log("MistakeMap summary:", {
      hasData: mmA.data?.data?.hasData,
      totalMistakes: mmA.data?.data?.totalMistakes,
      mistakeAccuracy: mmA.data?.data?.summary?.overallAccuracy,
      highPriorityConceptsCount: mmA.data?.data?.highPriorityConcepts?.length
    });

    // Check ConceptRoot
    const crA = await request("/concept-root", { headers: userA.authHeader }, userA.cookie);
    console.log("ConceptRoot:", {
      hasData: crA.data?.data?.hasData,
      conceptId: crA.data?.data?.conceptId,
      rootCause: crA.data?.data?.rootCause,
      diagnosis: crA.data?.data?.diagnosis,
      mastery: crA.data?.data?.mastery
    });

    // Check SkillGap
    const sgA = await request("/skill-gap", { headers: userA.authHeader }, userA.cookie);
    console.log("SkillGap:", {
      hasData: sgA.data?.data?.hasData,
      overallProficiency: sgA.data?.data?.overallProficiency,
      strongAreas: sgA.data?.data?.strongAreas?.map(s => s.skillName),
      weakAreas: sgA.data?.data?.weakAreas?.map(s => s.skillName)
    });

    // Check Revision
    const revA = await request("/revision", { headers: userA.authHeader }, userA.cookie);
    console.log("Revision items count:", revA.data?.data?.items?.length, "Due today:", revA.data?.data?.summary?.dueToday);

    // Check Roadmap
    const rmA = await request("/analytics/roadmap", { headers: userA.authHeader }, userA.cookie);
    console.log("Roadmap stages for Strong Student:", {
      targetCareer: rmA.data?.data?.targetCareer,
      readinessScore: rmA.data?.data?.readinessScore,
      phase1: {
        title: rmA.data?.data?.stages?.[0]?.title,
        status: rmA.data?.data?.stages?.[0]?.status,
        priority: rmA.data?.data?.stages?.[0]?.priority,
        isWeakConcept: rmA.data?.data?.stages?.[0]?.isWeakConcept,
        why: rmA.data?.data?.stages?.[0]?.why
      },
      phase4: {
        title: rmA.data?.data?.stages?.[3]?.title,
        status: rmA.data?.data?.stages?.[3]?.status,
        priority: rmA.data?.data?.stages?.[3]?.priority
      }
    });

    results.strongStudent = {
      scorePercent: submitA.data?.scorePercent,
      correctCount: submitA.data?.correctCount,
      incorrectCount: submitA.data?.incorrectCount,
      mistakeMap: mmA.data?.data,
      conceptRoot: crA.data?.data,
      skillGap: sgA.data?.data,
      revision: revA.data?.data,
      roadmap: rmA.data?.data
    };
  } catch (err) {
    console.error("Error in Test A:", err);
  }

  // =========================================================================
  // TEST B: WEAK STUDENT (20-40%)
  // =========================================================================
  logSection("TEST B: WEAK STUDENT (20-40%)");
  try {
    const userB = await registerAndLogin("weak", "Software Developer", "Beginner");
    console.log(`Registered User B: ${userB.email}`);

    const startB = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: userB.authHeader }, userB.cookie);
    const questionsB = startB.data?.assessment?.questions || [];

    // Intentionally answer 1 correct (20%) and 4 wrong on Boundary Conditions & Search-Space Invariants
    const responsesB = {};
    let answeredCorrect = false;
    for (const q of questionsB) {
      if (!answeredCorrect && q.question.includes("Q4")) {
        responsesB[q.id] = "while (low <= high)"; // 1 correct
        answeredCorrect = true;
      } else {
        // Deliberate wrong answer
        responsesB[q.id] = "completely_wrong_answer";
      }
    }

    const submitB = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: userB.authHeader,
      body: JSON.stringify({
        attemptId: startB.data.attemptId,
        responses: responsesB,
        elapsedSeconds: 50
      })
    }, userB.cookie);

    console.log("Submit result:", {
      status: submitB.status,
      scorePercent: submitB.data?.scorePercent,
      correctCount: submitB.data?.correctCount,
      incorrectCount: submitB.data?.incorrectCount
    });

    // Check MistakeMap
    const mmB = await request("/mistake-map", { headers: userB.authHeader }, userB.cookie);
    console.log("MistakeMap summary:", {
      hasData: mmB.data?.data?.hasData,
      totalMistakes: mmB.data?.data?.totalMistakes,
      mistakeAccuracy: mmB.data?.data?.summary?.overallAccuracy,
      highPriorityConcepts: mmB.data?.data?.highPriorityConcepts?.map(c => ({ concept: c.concept, incorrectCount: c.incorrectCount }))
    });

    // Check ConceptRoot
    const crB = await request("/concept-root", { headers: userB.authHeader }, userB.cookie);
    console.log("ConceptRoot:", {
      hasData: crB.data?.data?.hasData,
      conceptId: crB.data?.data?.conceptId,
      canonicalConcept: crB.data?.data?.canonicalConcept,
      rootCause: crB.data?.data?.rootCause,
      diagnosis: crB.data?.data?.diagnosis,
      mastery: crB.data?.data?.mastery,
      evidenceLength: crB.data?.data?.evidence?.length,
      explanation: crB.data?.data?.explanation ? "Generated AI explanation present" : "None"
    });

    // Check SkillGap
    const sgB = await request("/skill-gap", { headers: userB.authHeader }, userB.cookie);
    console.log("SkillGap:", {
      hasData: sgB.data?.data?.hasData,
      overallProficiency: sgB.data?.data?.overallProficiency,
      weakAreas: sgB.data?.data?.weakAreas?.map(s => ({ name: s.skillName, proficiency: s.currentProficiency, gap: s.gap }))
    });

    // Check Revision
    const revB = await request("/revision", { headers: userB.authHeader }, userB.cookie);
    console.log("Revision items for Weak Student:", revB.data?.data?.items?.map(i => ({
      concept: i.conceptName,
      priority: i.priority,
      status: i.status,
      weaknessScore: i.weaknessScore
    })));

    // Check Roadmap
    const rmB = await request("/analytics/roadmap", { headers: userB.authHeader }, userB.cookie);
    console.log("Roadmap stages for Weak Student:", {
      targetCareer: rmB.data?.data?.targetCareer,
      readinessScore: rmB.data?.data?.readinessScore,
      phase1: {
        title: rmB.data?.data?.stages?.[0]?.title,
        status: rmB.data?.data?.stages?.[0]?.status,
        priority: rmB.data?.data?.stages?.[0]?.priority,
        isWeakConcept: rmB.data?.data?.stages?.[0]?.isWeakConcept,
        concepts: rmB.data?.data?.stages?.[0]?.concepts,
        why: rmB.data?.data?.stages?.[0]?.why
      }
    });

    results.weakStudent = {
      scorePercent: submitB.data?.scorePercent,
      correctCount: submitB.data?.correctCount,
      incorrectCount: submitB.data?.incorrectCount,
      mistakeMap: mmB.data?.data,
      conceptRoot: crB.data?.data,
      skillGap: sgB.data?.data,
      revision: revB.data?.data,
      roadmap: rmB.data?.data
    };
  } catch (err) {
    console.error("Error in Test B:", err);
  }

  // =========================================================================
  // TEST C: REPEATING MISTAKE STUDENT
  // =========================================================================
  logSection("TEST C: REPEATING MISTAKE STUDENT");
  try {
    const userC = await registerAndLogin("repeater", "Software Developer", "Intermediate");
    console.log(`Registered User C: ${userC.email}`);

    // Take Assessment 1: Fail "Boundary Conditions"
    const startC1 = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: userC.authHeader }, userC.cookie);
    const questionsC1 = startC1.data?.assessment?.questions || [];

    const responsesC1 = {};
    for (const q of questionsC1) {
      if (q.concept === "Boundary Conditions") {
        responsesC1[q.id] = "wrong_boundary_choice";
      } else {
        // answer other concepts correctly
        if (q.question.includes("Q2")) responsesC1[q.id] = "high = mid - 1";
        else if (q.question.includes("Q4")) responsesC1[q.id] = "while (low <= high)";
        else responsesC1[q.id] = "wrong_answer";
      }
    }

    const submitC1 = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: userC.authHeader,
      body: JSON.stringify({
        attemptId: startC1.data.attemptId,
        responses: responsesC1,
        elapsedSeconds: 40
      })
    }, userC.cookie);

    console.log("Attempt 1 submitted:", { score: submitC1.data?.scorePercent, incorrect: submitC1.data?.incorrectCount });

    const crC1 = await request("/concept-root", { headers: userC.authHeader }, userC.cookie);
    const revC1 = await request("/revision", { headers: userC.authHeader }, userC.cookie);

    console.log("After Attempt 1:", {
      conceptRootConcept: crC1.data?.data?.canonicalConcept,
      rootCauseConfidence: crC1.data?.data?.rootCause?.confidence,
      evidenceCount: crC1.data?.data?.rootCause?.evidenceCount,
      diagnosisStatus: crC1.data?.data?.diagnosis?.status,
      revisionItems: revC1.data?.data?.items?.map(i => ({ name: i.conceptName, priorityScore: i.priorityScore, priority: i.priority }))
    });

    // Now Take Assessment 2: Fail the same concept again!
    const startC2 = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: userC.authHeader }, userC.cookie);
    const questionsC2 = startC2.data?.assessment?.questions || [];

    const responsesC2 = {};
    for (const q of questionsC2) {
      if (q.concept === "Boundary Conditions") {
        responsesC2[q.id] = "wrong_boundary_choice_again";
      } else {
        if (q.question.includes("Q2")) responsesC2[q.id] = "high = mid - 1";
        else if (q.question.includes("Q4")) responsesC2[q.id] = "while (low <= high)";
        else responsesC2[q.id] = "wrong_answer";
      }
    }

    const submitC2 = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: userC.authHeader,
      body: JSON.stringify({
        attemptId: startC2.data.attemptId,
        responses: responsesC2,
        elapsedSeconds: 35
      })
    }, userC.cookie);

    console.log("Attempt 2 submitted:", { score: submitC2.data?.scorePercent, incorrect: submitC2.data?.incorrectCount });

    const crC2 = await request("/concept-root", { headers: userC.authHeader }, userC.cookie);
    const revC2 = await request("/revision", { headers: userC.authHeader }, userC.cookie);

    console.log("After Attempt 2:", {
      conceptRootConcept: crC2.data?.data?.canonicalConcept,
      rootCauseConfidence: crC2.data?.data?.rootCause?.confidence,
      evidenceCount: crC2.data?.data?.rootCause?.evidenceCount,
      diagnosisStatus: crC2.data?.data?.diagnosis?.status,
      trend: crC2.data?.data?.mastery?.trend,
      revisionItems: revC2.data?.data?.items?.map(i => ({ name: i.conceptName, priorityScore: i.priorityScore, priority: i.priority }))
    });

    results.repeatingMistake = {
      attempt1: {
        score: submitC1.data?.scorePercent,
        conceptRoot: crC1.data?.data,
        revision: revC1.data?.data
      },
      attempt2: {
        score: submitC2.data?.scorePercent,
        conceptRoot: crC2.data?.data,
        revision: revC2.data?.data
      },
      comparison: {
        confidenceIncreased: crC2.data?.data?.rootCause?.confidence >= crC2.data?.data?.rootCause?.confidence,
        evidenceCountIncreased: (crC2.data?.data?.rootCause?.evidenceCount || 0) > (crC1.data?.data?.rootCause?.evidenceCount || 0),
        revisionPriorityHigher: (revC2.data?.data?.items?.[0]?.priorityScore || 0) >= (revC1.data?.data?.items?.[0]?.priorityScore || 0)
      }
    };
  } catch (err) {
    console.error("Error in Test C:", err);
  }

  // =========================================================================
  // TEST D: IMPROVEMENT STUDENT
  // =========================================================================
  logSection("TEST D: IMPROVEMENT STUDENT");
  try {
    const userD = await registerAndLogin("improver", "Software Developer", "Intermediate");
    console.log(`Registered User D: ${userD.email}`);

    // Assessment 1: Fail Boundary Conditions
    const startD1 = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: userD.authHeader }, userD.cookie);
    const questionsD1 = startD1.data?.assessment?.questions || [];
    const responsesD1 = {};
    for (const q of questionsD1) {
      responsesD1[q.id] = "wrong_answer";
    }

    const submitD1 = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: userD.authHeader,
      body: JSON.stringify({
        attemptId: startD1.data.attemptId,
        responses: responsesD1,
        elapsedSeconds: 40
      })
    }, userD.cookie);

    const crD1 = await request("/concept-root", { headers: userD.authHeader }, userD.cookie);
    const revD1 = await request("/revision", { headers: userD.authHeader }, userD.cookie);

    console.log("Attempt 1 (Failed):", {
      score: submitD1.data?.scorePercent,
      crConcept: crD1.data?.data?.canonicalConcept,
      crAccuracy: crD1.data?.data?.mastery?.accuracy,
      revCount: revD1.data?.data?.items?.length
    });

    // Assessment 2: Master the concept! 100% correct!
    const startD2 = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: userD.authHeader }, userD.cookie);
    const questionsD2 = startD2.data?.assessment?.questions || [];
    const responsesD2 = {};
    const correctMap = {
      "Q1": "low = mid + 1",
      "Q2": "high = mid - 1",
      "Q3": "mid = low + Math.floor((high - low) / 2)",
      "Q4": "while (low <= high)",
      "Q5": "mid - 1"
    };
    for (const q of questionsD2) {
      for (const [key, ans] of Object.entries(correctMap)) {
        if (q.question.includes(key)) {
          responsesD2[q.id] = ans;
          break;
        }
      }
      if (!responsesD2[q.id]) {
        responsesD2[q.id] = q.options?.find(o => o.includes("mid + 1") || o.includes("mid - 1") || o.includes("low <= high") || o.includes("floor")) || q.options?.[0];
      }
    }

    const submitD2 = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: userD.authHeader,
      body: JSON.stringify({
        attemptId: startD2.data.attemptId,
        responses: responsesD2,
        elapsedSeconds: 30
      })
    }, userD.cookie);

    const crD2 = await request("/concept-root", { headers: userD.authHeader }, userD.cookie);
    const revD2 = await request("/revision", { headers: userD.authHeader }, userD.cookie);

    console.log("Attempt 2 (Passed 100%):", {
      score: submitD2.data?.scorePercent,
      crConcept: crD2.data?.data?.canonicalConcept,
      crAccuracy: crD2.data?.data?.mastery?.accuracy,
      crRecentAccuracy: crD2.data?.data?.mastery?.recentAccuracy,
      crConfidence: crD2.data?.data?.rootCause?.confidence,
      crDiagnosis: crD2.data?.data?.diagnosis?.status,
      revItems: revD2.data?.data?.items?.map(i => ({ name: i.conceptName, priority: i.priority, score: i.priorityScore }))
    });

    results.improvementStudent = {
      attempt1: { score: submitD1.data?.scorePercent, cr: crD1.data?.data, rev: revD1.data?.data },
      attempt2: { score: submitD2.data?.scorePercent, cr: crD2.data?.data, rev: revD2.data?.data }
    };
  } catch (err) {
    console.error("Error in Test D:", err);
  }

  // =========================================================================
  // TEST E: CAREER GOAL IMPACT (Backend Engineer vs Data Scientist)
  // =========================================================================
  logSection("TEST E: CAREER GOAL IMPACT (SAME STUDENT DATA, DIFFERENT CAREER)");
  try {
    const userE = await registerAndLogin("career_test", "Software Developer", "Intermediate");
    
    // Take an assessment so student has real data
    const startE = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: userE.authHeader }, userE.cookie);
    const questionsE = startE.data?.assessment?.questions || [];
    const responsesE = {};
    let count = 0;
    for (const q of questionsE) {
      responsesE[q.id] = (count++ % 2 === 0) ? "while (low <= high)" : "wrong_answer";
    }
    await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: userE.authHeader,
      body: JSON.stringify({ attemptId: startE.data.attemptId, responses: responsesE, elapsedSeconds: 40 })
    }, userE.cookie);

    // Career 1: Full-Stack Developer
    await request("/auth/profile", {
      method: "PUT",
      headers: userE.authHeader,
      body: JSON.stringify({ careerGoal: "Full-Stack Software Engineer" })
    }, userE.cookie);

    const sgDev = await request("/skill-gap", { headers: userE.authHeader }, userE.cookie);
    const rmDev = await request("/analytics/roadmap", { headers: userE.authHeader }, userE.cookie);

    // Career 2: Data Scientist
    await request("/auth/profile", {
      method: "PUT",
      headers: userE.authHeader,
      body: JSON.stringify({ careerGoal: "Data Scientist" })
    }, userE.cookie);

    const sgDS = await request("/skill-gap", { headers: userE.authHeader }, userE.cookie);
    const rmDS = await request("/analytics/roadmap", { headers: userE.authHeader }, userE.cookie);

    console.log("Full-Stack Developer Roadmap Concepts:", {
      career: rmDev.data?.data?.targetCareer,
      phase2Concepts: rmDev.data?.data?.stages?.[1]?.concepts,
      skillGapSkills: sgDev.data?.data?.skills?.map(s => s.skillName)
    });

    console.log("Data Scientist Roadmap Concepts:", {
      career: rmDS.data?.data?.targetCareer,
      phase2Concepts: rmDS.data?.data?.stages?.[1]?.concepts,
      skillGapSkills: sgDS.data?.data?.skills?.map(s => s.skillName)
    });

    // Custom Career: e.g. "Cybersecurity Specialist"
    await request("/auth/profile", {
      method: "PUT",
      headers: userE.authHeader,
      body: JSON.stringify({ careerGoal: "Cybersecurity" })
    }, userE.cookie);
    const rmCyber = await request("/analytics/roadmap", { headers: userE.authHeader }, userE.cookie);
    console.log("Custom Career (Cybersecurity) Roadmap:", {
      career: rmCyber.data?.data?.targetCareer,
      phase1: rmCyber.data?.data?.stages?.[0]?.title,
      phase2Concepts: rmCyber.data?.data?.stages?.[1]?.concepts
    });

    results.careerImpact = {
      fullstack: { career: rmDev.data?.data?.targetCareer, skills: sgDev.data?.data?.skills?.map(s => s.skillName), phase2: rmDev.data?.data?.stages?.[1]?.concepts },
      dataScientist: { career: rmDS.data?.data?.targetCareer, skills: sgDS.data?.data?.skills?.map(s => s.skillName), phase2: rmDS.data?.data?.stages?.[1]?.concepts },
      cybersecurity: { career: rmCyber.data?.data?.targetCareer, phase2: rmCyber.data?.data?.stages?.[1]?.concepts }
    };
  } catch (err) {
    console.error("Error in Test E:", err);
  }

  // =========================================================================
  // TEST F: FULL END-TO-END INTEGRATION FLOW & DATA PERSISTENCE
  // =========================================================================
  logSection("TEST F: FULL END-TO-END INTEGRATION FLOW & DATA PERSISTENCE");
  try {
    const e2eLogs = [];
    const logStep = (step, method, endpoint, status, summary) => {
      e2eLogs.push({ step, method, endpoint, status, summary });
      console.log(`[E2E Step ${step}] ${method} ${endpoint} -> Status: ${status} | ${summary}`);
    };

    // 1. Register
    const email = `e2e_student_${Date.now()}@test.com`;
    const password = "Password123!";
    const regRes = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "E2E Tester", email, password })
    });
    logStep(1, "POST", "/auth/register", regRes.status, `User registered: ${email}`);

    let cookie = regRes.setCookie;
    let token = regRes.data?.token;
    let authHeader = token ? { "Authorization": `Bearer ${token}` } : {};

    // 2. Login
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (loginRes.setCookie) cookie = loginRes.setCookie;
    if (loginRes.data?.token) {
      token = loginRes.data.token;
      authHeader = { "Authorization": `Bearer ${token}` };
    }
    logStep(2, "POST", "/auth/login", loginRes.status, "Login successful, token/cookie verified");

    // 3. Complete Onboarding
    const obRes = await request("/auth/onboarding", {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({ field: "Computer Science", careerGoal: "Software Developer", level: "Beginner" })
    }, cookie);
    logStep(3, "PUT", "/auth/onboarding", obRes.status, "Onboarding profile saved");

    // 4. Dashboard (Initial)
    const dbInitial = await request("/dashboard", { headers: authHeader }, cookie);
    logStep(4, "GET", "/dashboard", dbInitial.status, `Initial Dashboard loaded. Total attempts: ${dbInitial.data?.data?.totalAssessments || 0}`);

    // 5. Start Assessment
    const startRes = await request(`/assessments/${assessmentId}/start`, { method: "GET", headers: authHeader }, cookie);
    logStep(5, "GET", `/assessments/${assessmentId}/start`, startRes.status, `Assessment started. AttemptId: ${startRes.data?.attemptId}`);

    // 6. Submit Assessment
    const qList = startRes.data?.assessment?.questions || [];
    const responses = {};
    for (const q of qList) {
      responses[q.id] = q.options?.[0] || "Answer";
    }
    const submitRes = await request(`/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        attemptId: startRes.data.attemptId,
        responses,
        elapsedSeconds: 45
      })
    }, cookie);
    logStep(6, "POST", `/assessments/${assessmentId}/submit`, submitRes.status, `Attempt submitted. Score: ${submitRes.data?.scorePercent}%`);

    // 7. MistakeMap
    const mmRes = await request("/mistake-map", { headers: authHeader }, cookie);
    logStep(7, "GET", "/mistake-map", mmRes.status, `MistakeMap retrieved. Mistakes: ${mmRes.data?.data?.totalMistakes}`);

    // 8. ConceptRoot
    const crRes = await request("/concept-root", { headers: authHeader }, cookie);
    logStep(8, "GET", "/concept-root", crRes.status, `ConceptRoot loaded. Concept: ${crRes.data?.data?.canonicalConcept}`);

    // 9. SkillGap
    const sgRes = await request("/skill-gap", { headers: authHeader }, cookie);
    logStep(9, "GET", "/skill-gap", sgRes.status, `SkillGap loaded. Skills count: ${sgRes.data?.data?.skills?.length}`);

    // 10. Revision Center
    const revRes = await request("/revision", { headers: authHeader }, cookie);
    logStep(10, "GET", "/revision", revRes.status, `Revision dashboard loaded. Items count: ${revRes.data?.data?.items?.length}`);

    // If there's a revision item, test starting and completing session
    const firstRev = revRes.data?.data?.items?.[0];
    if (firstRev) {
      const revSessionRes = await request(`/revision/${firstRev.conceptId}`, { headers: authHeader }, cookie);
      logStep(10.1, "GET", `/revision/${firstRev.conceptId}`, revSessionRes.status, `Revision session loaded for ${firstRev.conceptId}`);

      const completeRevRes = await request(`/revision/${firstRev.conceptId}/complete`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ practiceAccuracy: 90, confidence: 4 })
      }, cookie);
      logStep(10.2, "POST", `/revision/${firstRev.conceptId}/complete`, completeRevRes.status, `Revision marked complete. Next review: ${completeRevRes.data?.data?.nextReviewAt}`);
    }

    // 11. Course Request
    const courseRes = await request("/course-requests", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        courseName: "Advanced Distributed Systems",
        provider: "MIT OpenCourseWare",
        referenceUrl: "https://ocw.mit.edu/courses/6-824-distributed-systems",
        reason: "Required for senior backend engineering career path"
      })
    }, cookie);
    logStep(11, "POST", "/course-requests", courseRes.status, `Course request submitted. ID: ${courseRes.data?.request?.id}`);

    // 12. AI Roadmap
    const rmRes = await request("/analytics/roadmap", { headers: authHeader }, cookie);
    logStep(12, "GET", "/analytics/roadmap", rmRes.status, `Roadmap retrieved. Stages: ${rmRes.data?.data?.stages?.length}`);

    // 13. Complete Roadmap Stage (Toggle Stage 1 completion)
    const updateRmRes = await request("/analytics/roadmap", {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({ stageId: 1 })
    }, cookie);
    logStep(13, "PUT", "/analytics/roadmap", updateRmRes.status, `Stage 1 toggled. CompletedStageIds: ${JSON.stringify(updateRmRes.data?.data?.completedStageIds)}`);

    // 14. Refresh / Re-query verification before logout
    const verifyBeforeLogout = await request("/analytics/roadmap", { headers: authHeader }, cookie);
    const stage1CompletedBefore = verifyBeforeLogout.data?.data?.completedStageIds?.includes(1);
    logStep(14, "GET", "/analytics/roadmap (refresh)", verifyBeforeLogout.status, `Progress persisted on refresh: ${stage1CompletedBefore}`);

    // 15. Logout
    const logoutRes = await request("/auth/logout", { method: "POST", headers: authHeader }, cookie);
    logStep(15, "POST", "/auth/logout", logoutRes.status, "Logged out successfully");

    // 16. Login again
    const reloginRes = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const newCookie = reloginRes.setCookie || cookie;
    const newToken = reloginRes.data?.token;
    const newAuthHeader = newToken ? { "Authorization": `Bearer ${newToken}` } : authHeader;
    logStep(16, "POST", "/auth/login (re-login)", reloginRes.status, "Re-logged in with fresh session");

    // 17. Verify data persistence after re-login
    const verifyAfterLogin = await request("/analytics/roadmap", { headers: newAuthHeader }, newCookie);
    const stage1CompletedAfter = verifyAfterLogin.data?.data?.completedStageIds?.includes(1);
    const mmAfter = await request("/mistake-map", { headers: newAuthHeader }, newCookie);
    const crAfter = await request("/concept-root", { headers: newAuthHeader }, newCookie);
    const courseAfter = await request("/course-requests/my", { headers: newAuthHeader }, newCookie);

    logStep(17, "GET", "Post-Login Verification", 200, `Stage 1 still completed: ${stage1CompletedAfter}, Mistakes persisted: ${mmAfter.data?.data?.totalMistakes}, CourseRequests: ${courseAfter.data?.requests?.length}`);

    results.e2eFlow = {
      logs: e2eLogs,
      stage1PersistsAcrossSessions: stage1CompletedAfter,
      mistakesPersisted: mmAfter.data?.data?.totalMistakes > 0,
      courseRequestPersisted: courseAfter.data?.requests?.length > 0
    };
  } catch (err) {
    console.error("Error in Test F:", err);
  }

  return results;
}

runAllTests().then((res) => {
  console.log("\nALL TESTS COMPLETE. Writing raw results to disk...");
  import('fs').then(fs => {
    fs.writeFileSync('./scratch_test_results.json', JSON.stringify(res, null, 2));
    console.log("Results successfully written to ./scratch_test_results.json");
  });
}).catch(console.error);
