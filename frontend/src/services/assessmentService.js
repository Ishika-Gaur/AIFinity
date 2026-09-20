import { assessmentApi } from "./api";

// Private closure cache for offline / fallback attempt sessions
const attemptSessionCache = new Map();

/**
 * Fisher-Yates array shuffler
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getNormalizedQuestionType(q) {
  const t = String(q.type || "").toLowerCase().trim();
  if (["mcq", "multiple-choice", "scenario", "logical-reasoning", "data-interpretation"].includes(t)) {
    return "mcq";
  }
  if (["true_false", "true-false", "tf", "boolean"].includes(t)) {
    return "true_false";
  }
  if (["short_answer", "short-answer", "short", "output", "fill-in-the-blank"].includes(t)) {
    return "short_answer";
  }
  if (["long_answer", "long-answer", "essay", "descriptive", "conceptual", "problem-solving", "coding"].includes(t)) {
    return "long_answer";
  }
  if (Array.isArray(q.options) && q.options.length > 0) {
    if (q.options.length === 2) {
      const o0 = String(q.options[0]).toLowerCase();
      const o1 = String(q.options[1]).toLowerCase();
      if ((o0 === "true" || o0 === "false") && (o1 === "true" || o1 === "false")) {
        return "true_false";
      }
    }
    return "mcq";
  }
  return "short_answer";
}

function evaluateSingleQuestion(q, userResp, sessionQ) {
  const maxMarks = 10;
  const normType = getNormalizedQuestionType(q);
  const qId = String(q.id || q._id);
  const qText = q.question;

  const originalAnswer = sessionQ ? sessionQ.answer : q.answer;
  const originalOptions = sessionQ ? (sessionQ.options || q.options) : q.options;
  const shuffledOptions = sessionQ ? sessionQ.shuffledOptions : q.options;

  // Unanswered Check
  if (userResp === undefined || userResp === null || String(userResp).trim() === "") {
    return {
      questionId: qId,
      questionText: qText,
      type: normType,
      userAnswer: null,
      correctAnswer: originalAnswer != null ? String(originalAnswer) : "N/A",
      status: "unanswered",
      isCorrect: false,
      marksAwarded: 0,
      maxMarks,
      explanation: "Question was left unanswered.",
    };
  }

  // 1. MCQ
  if (normType === "mcq") {
    let userText = String(userResp);
    if (typeof userResp === "number" && Array.isArray(shuffledOptions) && shuffledOptions[userResp] !== undefined) {
      userText = shuffledOptions[userResp];
    }

    let correctText = String(originalAnswer);
    if (typeof originalAnswer === "number" && Array.isArray(originalOptions) && originalOptions[originalAnswer] !== undefined) {
      correctText = originalOptions[originalAnswer];
    }

    const isMatch = userText.trim().toLowerCase() === correctText.trim().toLowerCase();
    return {
      questionId: qId,
      questionText: qText,
      type: normType,
      userAnswer: userText,
      correctAnswer: correctText,
      status: isMatch ? "correct" : "incorrect",
      isCorrect: isMatch,
      marksAwarded: isMatch ? maxMarks : 0,
      maxMarks,
      explanation: isMatch ? "Correct option selected." : `Incorrect option selected. You chose "${userText}".`,
    };
  }

  // 2. TRUE / FALSE
  if (normType === "true_false") {
    let userChoice = String(userResp).trim().toLowerCase();
    if (userResp === 0 || userResp === "0") userChoice = "true";
    if (userResp === 1 || userResp === "1") userChoice = "false";
    if (userChoice === "t" || userChoice === "yes") userChoice = "true";
    if (userChoice === "f" || userChoice === "no") userChoice = "false";

    let correctChoice = String(originalAnswer).trim().toLowerCase();
    if (originalAnswer === true || originalAnswer === 0 || originalAnswer === "0" || correctChoice === "t" || correctChoice === "yes") correctChoice = "true";
    if (originalAnswer === false || originalAnswer === 1 || originalAnswer === "1" || correctChoice === "f" || correctChoice === "no") correctChoice = "false";

    const isMatch = userChoice === correctChoice;
    const formattedUser = userChoice === "true" ? "True" : "False";
    const formattedCorrect = correctChoice === "true" ? "True" : "False";

    return {
      questionId: qId,
      questionText: qText,
      type: normType,
      userAnswer: formattedUser,
      correctAnswer: formattedCorrect,
      status: isMatch ? "correct" : "incorrect",
      isCorrect: isMatch,
      marksAwarded: isMatch ? maxMarks : 0,
      maxMarks,
      explanation: isMatch ? "Correct choice selected." : `Incorrect choice. You selected "${formattedUser}".`,
    };
  }

  // 3. SHORT ANSWER
  if (normType === "short_answer") {
    const userText = String(userResp).trim();
    const correctText = originalAnswer ? String(originalAnswer).trim() : "";

    const cleanUser = userText.toLowerCase().replace(/[^\w\s]/gi, "");
    const cleanCorrect = correctText.toLowerCase().replace(/[^\w\s]/gi, "");

    let isMatch = cleanUser === cleanCorrect;
    if (!isMatch && cleanCorrect && cleanUser.includes(cleanCorrect)) {
      isMatch = true;
    }

    return {
      questionId: qId,
      questionText: qText,
      type: normType,
      userAnswer: userText,
      correctAnswer: correctText || "Valid short answer required",
      status: isMatch ? "correct" : "incorrect",
      isCorrect: isMatch,
      marksAwarded: isMatch ? maxMarks : 0,
      maxMarks,
      explanation: isMatch ? "Exact/Normalized match with target answer." : `Submitted: "${userText}". Expected: "${correctText}".`,
    };
  }

  // 4. LONG ANSWER / ESSAY / CODE
  if (normType === "long_answer") {
    const userText = String(userResp).trim();
    const modelAnswer = originalAnswer ? String(originalAnswer).trim() : "";

    const words = userText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    let marksAwarded = 0;
    let status = "incorrect";
    let isCorrect = false;
    let explanation = "";

    if (modelAnswer) {
      const modelKeywords = modelAnswer
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const uniqueKeywords = [...new Set(modelKeywords)];
      let matchedCount = 0;
      const cleanUserLower = userText.toLowerCase();

      uniqueKeywords.forEach((kw) => {
        if (cleanUserLower.includes(kw)) matchedCount++;
      });

      const matchRatio = uniqueKeywords.length ? matchedCount / uniqueKeywords.length : 0.5;

      if (matchRatio >= 0.6 && wordCount >= 10) {
        marksAwarded = maxMarks;
        status = "correct";
        isCorrect = true;
        explanation = "Comprehensive answer covering key technical concepts accurately.";
      } else if (matchRatio >= 0.3 || wordCount >= 25) {
        marksAwarded = 7;
        status = "partial";
        isCorrect = true;
        explanation = "Satisfactory answer covering core points with relevant detail.";
      } else if (wordCount >= 10) {
        marksAwarded = 5;
        status = "partial";
        isCorrect = false;
        explanation = "Basic response provided, but lacks necessary depth and key concepts.";
      } else {
        marksAwarded = 2;
        status = "incorrect";
        isCorrect = false;
        explanation = "Response is too brief to adequately address the question prompt.";
      }
    } else {
      if (wordCount >= 25) {
        marksAwarded = maxMarks;
        status = "correct";
        isCorrect = true;
        explanation = "Detailed, thorough answer provided.";
      } else if (wordCount >= 10) {
        marksAwarded = 7;
        status = "partial";
        isCorrect = true;
        explanation = "Clear response provided.";
      } else {
        marksAwarded = 3;
        status = "incorrect";
        isCorrect = false;
        explanation = "Response is too brief.";
      }
    }

    return {
      questionId: qId,
      questionText: qText,
      type: normType,
      userAnswer: userText,
      correctAnswer: modelAnswer || "Detailed explanation",
      status,
      isCorrect,
      marksAwarded,
      maxMarks,
      explanation,
    };
  }

  return {
    questionId: qId,
    questionText: qText,
    type: normType,
    userAnswer: String(userResp),
    correctAnswer: "N/A",
    status: "correct",
    isCorrect: true,
    marksAwarded: maxMarks,
    maxMarks,
    explanation: "Answer submitted.",
  };
}

/**
 * Creates a fresh, randomized assessment attempt.
 * Never fails or crashes even if backend API is offline or requested ID is generic.
 */
export async function createAttemptSession(assessmentId) {
  // 1. Try backend API first if available
  try {
    const apiRes = await assessmentApi.startAttempt(assessmentId);
    if (apiRes && apiRes.success && apiRes.assessment) {
      return {
        success: true,
        attemptId: apiRes.attemptId,
        assessment: apiRes.assessment,
        isRemote: true,
      };
    }
  } catch (err) {
    console.warn("Backend startAttempt error:", err);
  }

  // 2. Client-side resilience fallback session:
  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const answersMap = new Map();

  const isSocialScience = /social|science|history|geography|civics|10th|cbse/i.test(String(assessmentId || ""));
  const fallbackQuestions = isSocialScience ? [
    {
      id: "q_fallback_1",
      type: "mcq",
      concept: "Democratic Governance",
      question: "In democratic systems, which of the following is considered the key benefit of power sharing among different social and linguistic groups?",
      options: [
        "It accommodates diversity and prevents social conflict",
        "It leads to concentration of executive authority in one office",
        "It abolishes the rule of law and judicial independence",
        "It completely stops public discussion on government legislation"
      ],
      answer: "It accommodates diversity and prevents social conflict",
      explanation: "Power sharing ensures fair representation and prevents majoritarian conflict."
    },
    {
      id: "q_fallback_2",
      type: "mcq",
      concept: "Economic Development",
      question: "Which index measures the development of a country by combining education, life expectancy, and per capita income?",
      options: [
        "Human Development Index (HDI)",
        "Consumer Price Index (CPI)",
        "Gross Domestic Reserve Index",
        "Industrial Production Index"
      ],
      answer: "Human Development Index (HDI)",
      explanation: "HDI provides a holistic metric of socio-economic progress beyond mere per capita income."
    },
    {
      id: "q_fallback_3",
      type: "mcq",
      concept: "Resource Conservation",
      question: "What is the core principle of sustainable development in resource management?",
      options: [
        "Meeting present needs without compromising the ability of future generations to meet theirs",
        "Consuming all non-renewable fossil fuel resources as rapidly as possible",
        "Halting all infrastructure and technological advancements permanently",
        "Leaving agricultural lands uncultivated indefinitely"
      ],
      answer: "Meeting present needs without compromising the ability of future generations to meet theirs",
      explanation: "Sustainable development emphasizes balance between environmental preservation and equitable growth."
    },
    {
      id: "q_fallback_4",
      type: "mcq",
      concept: "Constitutional Framework",
      question: "Under the horizontal division of power, which three organs check and balance each other?",
      options: [
        "Legislature, Executive, and Judiciary",
        "Army, Police, and Private Security",
        "Central Government, State Government, and Village Panchayat",
        "Commercial Banks, Stock Exchange, and Central Treasury"
      ],
      answer: "Legislature, Executive, and Judiciary",
      explanation: "Horizontal separation of powers among legislature, executive, and judiciary ensures accountability."
    },
    {
      id: "q_fallback_5",
      type: "mcq",
      concept: "National Integration",
      question: "Which factor was critical in uniting diverse communities during historical mass independence movements?",
      options: [
        "A shared identity of collective belonging, cultural symbols, and joint struggles",
        "Total isolation of rural peasants from urban workers",
        "Prohibition of all local regional languages and customs",
        "Exclusive economic privileges for selected colonial trading firms"
      ],
      answer: "A shared identity of collective belonging, cultural symbols, and joint struggles",
      explanation: "Nationalism and collective struggle united diverse sections of society against colonial oppression."
    }
  ] : [
    {
      id: "q_fallback_1",
      type: "mcq",
      concept: "Core Fundamentals",
      question: `What is the most critical first step when analyzing a problem in ${assessmentId || "your domain"}?`,
      options: [
        "Clearly defining the requirements, constraints, and objective metrics",
        "Immediately implementing an unverified hypothesis",
        "Skipping exploratory analysis and documentation",
        "Relying purely on subjective assumptions without verification"
      ],
      answer: "Clearly defining the requirements, constraints, and objective metrics",
      explanation: "Structured requirement definition prevents ambiguity and guides effective implementation."
    },
    {
      id: "q_fallback_2",
      type: "mcq",
      concept: "System Optimization",
      question: "Why is modularity considered a foundational standard in modern design and engineering?",
      options: [
        "It enhances reusability, simplifies debugging, and reduces coupling",
        "It forces all logic to reside in a single monolithic file",
        "It prevents multiple developers from collaborating on the project",
        "It increases computational latency unnecessarily"
      ],
      answer: "It enhances reusability, simplifies debugging, and reduces coupling",
      explanation: "Modular architectures allow isolated testing, maintainability, and clean separation of concerns."
    },
    {
      id: "q_fallback_3",
      type: "mcq",
      concept: "Quality Assurance",
      question: "What is the primary objective of continuous testing and benchmarking?",
      options: [
        "Detecting regressions and performance bottlenecks early in the development cycle",
        "Eliminating the need for peer review and documentation",
        "Restricting future feature iterations",
        "Bypassing runtime validation checks"
      ],
      answer: "Detecting regressions and performance bottlenecks early in the development cycle",
      explanation: "Early automated validation ensures consistency, reliability, and robust performance."
    },
    {
      id: "q_fallback_4",
      type: "mcq",
      concept: "Diagnostic Analysis",
      question: "When an unexpected failure or anomaly occurs, what diagnostic sequence is most effective?",
      options: [
        "Reproduce the issue, inspect execution logs, isolate variables, and verify fix",
        "Ignore the error and deploy directly to production",
        "Discard previous version control history completely",
        "Randomly alter config parameters until the error message changes"
      ],
      answer: "Reproduce the issue, inspect execution logs, isolate variables, and verify fix",
      explanation: "Systematic root-cause diagnosis ensures errors are resolved accurately without side effects."
    },
    {
      id: "q_fallback_5",
      type: "mcq",
      concept: "Iterative Learning",
      question: "How do active practice and real-world application improve conceptual mastery?",
      options: [
        "They build resilient mental models and develop adaptive problem-solving skills",
        "They encourage rote memorization without contextual understanding",
        "They limit exposure to edge-case scenarios",
        "They prevent conceptual connections between related topics"
      ],
      answer: "They build resilient mental models and develop adaptive problem-solving skills",
      explanation: "Hands-on application cements neural pathways and enables practical transfer of learning."
    }
  ];

  const shuffledQuestions = shuffleArray(fallbackQuestions).map((q, idx) => {
    const qId = q.id || `q_${idx}`;
    answersMap.set(qId, {
      answer: q.answer,
      type: q.type,
      options: q.options ? [...q.options] : null,
      concept: q.concept,
    });

    const questionCopy = { ...q, id: qId };
    delete questionCopy.answer;

    if (Array.isArray(q.options) && q.options.length > 0) {
      const originalOptions = [...q.options];
      const shuffledOptions = shuffleArray(originalOptions);
      questionCopy.options = shuffledOptions;
      answersMap.get(qId)._originalOptions = originalOptions;
      answersMap.get(qId).shuffledOptions = shuffledOptions;
    }

    return questionCopy;
  });

  attemptSessionCache.set(attemptId, {
    assessmentId,
    createdAt: Date.now(),
    answersMap,
    questions: shuffledQuestions,
  });

  return {
    success: true,
    attemptId,
    assessment: {
      id: assessmentId,
      title: `${assessmentId || "Diagnostic"} Assessment`,
      category: assessmentId || "General",
      field: assessmentId || "General",
      duration: 10,
      questions: shuffledQuestions,
    },
    isRemote: false,
  };
}

/**
 * Validates and submits assessment answers server-side (or via session validator).
 */
export async function submitAttemptSession(assessmentId, attemptId, responses, elapsedSeconds, violations = []) {
  const title = "Assessment Attempt";
  const category = "General";
  const field = "";

  const payload = {
    attemptId,
    responses,
    elapsedSeconds,
    violations,
    assessmentTitle: title,
    assessmentCategory: category,
    assessmentField: field,
  };

  // 1. Try AI evaluation first
  try {
    const aiRes = await assessmentApi.evaluateAI(assessmentId, payload);
    if (aiRes && aiRes.success) {
      return aiRes;
    }
  } catch (_) {}

  // 2. Fallback: Try standard backend submitAttempt
  try {
    const apiRes = await assessmentApi.submitAttempt(assessmentId, payload);
    if (apiRes && apiRes.success) {
      return apiRes;
    }
  } catch (_) {}

  // 3. Fallback: Validate against private closure session cache
  const session = attemptSessionCache.get(attemptId);
  const questions = session ? session.questions : [];
  const answersMap = session ? session.answersMap : null;

  const questionResults = [];
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const qId = String(q.id || q._id);
    const userResp = responses ? responses[qId] : undefined;
    const sessionQ = answersMap ? answersMap.get(qId) : null;

    const evalResult = evaluateSingleQuestion(q, userResp, sessionQ);
    questionResults.push(evalResult);

    totalScore += evalResult.marksAwarded;
    maxScore += evalResult.maxMarks;

    if (evalResult.status === "correct" || evalResult.marksAwarded >= 7) {
      correctCount++;
    } else if (evalResult.status === "unanswered") {
      unansweredCount++;
    } else {
      incorrectCount++;
    }
  });

  const percentage = maxScore > 0 ? Math.min(100, Math.round((totalScore / maxScore) * 100)) : 0;
  const attemptedCount = questions.length - unansweredCount;

  // Clean up session cache
  if (attemptId) {
    attemptSessionCache.delete(attemptId);
  }

  const rating = percentage >= 80 ? "Excellent" : percentage >= 60 ? "Good" : percentage >= 40 ? "Average" : "Needs Improvement";
  const correctConcepts = Array.from(new Set(questionResults.filter(q => q.status === "correct").map(q => q.concept || q.topic).filter(Boolean)));
  const missedConcepts = Array.from(new Set(questionResults.filter(q => q.status !== "correct" && q.status !== "unanswered").map(q => q.concept || q.topic).filter(Boolean)));

  const strengths = correctConcepts.length > 0 
    ? correctConcepts.slice(0, 3).map(c => `Solid understanding of ${c}`)
    : ["Attempted foundational assessment questions"];
  const areasToImprove = missedConcepts.length > 0 
    ? missedConcepts.slice(0, 3).map(c => `Review core principles of ${c}`)
    : ["Continue practicing advanced diagnostic questions"];

  const overallFeedback = `The student completed the assessment with a score of ${percentage}%. ${
    percentage >= 60
      ? "Demonstrated solid understanding of fundamental concepts with key strengths in assessed topics."
      : "Gaps were observed in core concept applications; targeted review is recommended."
  }`;

  const result = {
    success: true,
    scorePercent: percentage,
    totalScore,
    maxScore,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    attemptedCount,
    answeredCount: attemptedCount,
    gradableCount: questions.length,
    attemptedGradableCount: attemptedCount,
    unansweredTotalCount: unansweredCount,
    totalQuestions: questions.length,
    questionResults,
    elapsedSeconds,
    overallFeedback,
    overallRating: rating,
    strengths,
    areasToImprove,
    violationsCount: violations.length,
    violations,
    autoSubmitted: violations.length >= 3,
  };

  // Sync attempt to backend so MongoDB always receives AttemptResult and updates Roadmap
  try {
    await assessmentApi.syncAttempt({
      assessmentTitle: title,
      assessmentCategory: category,
      assessmentField: field,
      scorePercent: percentage,
      totalScore,
      maxScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalQuestions: questions.length,
      elapsedSeconds,
      questionResults,
    });
  } catch (_) {}

  return result;
}
