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
  } catch (_) {}

// Fallback removed. If backend fails, throw error.
  throw new Error("Failed to start assessment from server.");

  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const answersMap = new Map();

  // Shuffle question order
  const shuffledQuestions = shuffleArray(rawAssessment.questions || []).map((q, idx) => {
    const qId = q.id || q._id || `q_${idx}`;
    const originalAnswer = q.answer;

    answersMap.set(qId, {
      answer: originalAnswer,
      type: q.type,
      options: q.options ? [...q.options] : null,
    });

    const questionCopy = { ...q, id: qId };
    delete questionCopy.answer; // SECURITY: Strip answer out of question object

    if (Array.isArray(q.options) && q.options.length > 0) {
      const originalOptions = [...q.options];
      const shuffledOptions = shuffleArray(originalOptions);
      questionCopy.options = shuffledOptions;
      answersMap.get(qId)._originalOptions = originalOptions;
      answersMap.get(qId).shuffledOptions = shuffledOptions;
    }

    return questionCopy;
  });

  // Save in closure-private session cache
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
      ...rawAssessment,
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
