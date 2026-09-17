import { buildMistakeMapAnalysis } from "../src/services/mistakeMapService.js";
import { generateMistakeMapInsightsWithAI } from "../src/services/geminiService.js";
import { classifyMistakeDeterministically } from "../src/controllers/assessmentController.js";

function assert(condition, message) {
  if (!condition) {
    console.error("❌ ASSERTION FAILED:", message);
    process.exit(1);
  }
}

console.log("=================================================");
console.log(" MISTAKE MAP END-TO-END DATA-DRIVEN INTEGRATION TEST");
console.log("=================================================");

// -------------------------------------------------------------
// STAGE 1: New User with 0 Assessments
// -------------------------------------------------------------
console.log("\n[Stage 1] Testing New User (0 assessments)...");
const stage1Analysis = buildMistakeMapAnalysis([], { careerGoal: "Full-Stack Engineer" });
assert(stage1Analysis.hasData === false, "Stage 1 hasData should be false");
assert(stage1Analysis.totalAttempts === 0, "Stage 1 totalAttempts should be 0");
assert(stage1Analysis.summary.totalMistakes === 0, "Stage 1 totalMistakes should be 0");
assert(stage1Analysis.highPriorityConcepts.length === 0, "Stage 1 highPriorityConcepts should be empty");

const stage1AI = await generateMistakeMapInsightsWithAI(stage1Analysis, { careerGoal: "Full-Stack Engineer" });
assert(stage1AI.isInsufficientData === true, "Stage 1 AI should flag isInsufficientData: true");
assert(stage1AI.focusMore.length === 0, "Stage 1 AI should have 0 focusMore items");
console.log("✓ Stage 1 Passed: Clean empty state, zero hallucination");

// -------------------------------------------------------------
// STAGE 2: User with 1 Assessment (Baseline)
// -------------------------------------------------------------
console.log("\n[Stage 2] Testing User with 1 Assessment...");
const attempt1 = {
  _id: "attempt_001",
  assessmentTitle: "DSA Benchmark Assessment",
  assessmentCategory: "Data Structures",
  assessmentField: "Computer Science",
  scorePercent: 40,
  totalQuestions: 5,
  correctCount: 2,
  completedAt: new Date("2026-09-01T12:00:00Z"),
  questionResults: [
    {
      questionId: "q1",
      questionText: "Which collision resolution technique uses linked lists?",
      topic: "Data Structures",
      concept: "Hashing",
      difficulty: "Medium",
      isCorrect: false,
      status: "incorrect",
      mistakeType: "CONCEPTUAL",
      userAnswer: "Linear Probing",
      correctAnswer: "Chaining",
    },
    {
      questionId: "q2",
      questionText: "Compute the hash table load factor if n=10, m=5",
      topic: "Data Structures",
      concept: "Hashing",
      difficulty: "Medium",
      isCorrect: false,
      status: "incorrect",
      mistakeType: "CARELESS",
      userAnswer: "1.9",
      correctAnswer: "2.0",
    },
    {
      questionId: "q3",
      questionText: "What is the time complexity of binary search on sorted array?",
      topic: "Algorithms",
      concept: "Binary Search",
      difficulty: "Easy",
      isCorrect: false,
      status: "incorrect",
      mistakeType: "UNKNOWN",
      userAnswer: "O(n)",
      correctAnswer: "O(log n)",
    },
    {
      questionId: "q4",
      questionText: "Access element at index 0 of array",
      topic: "Data Structures",
      concept: "Arrays",
      difficulty: "Easy",
      isCorrect: true,
      status: "correct",
      mistakeType: "",
      userAnswer: "arr[0]",
      correctAnswer: "arr[0]",
    },
    {
      questionId: "q5",
      questionText: "Find array length",
      topic: "Data Structures",
      concept: "Arrays",
      difficulty: "Easy",
      isCorrect: true,
      status: "correct",
      mistakeType: "",
      userAnswer: "arr.length",
      correctAnswer: "arr.length",
    },
  ],
};

const stage2Analysis = buildMistakeMapAnalysis([attempt1], { careerGoal: "Software Engineer" });
assert(stage2Analysis.hasData === true, "Stage 2 hasData should be true");
assert(stage2Analysis.totalAttempts === 1, "Stage 2 totalAttempts should be 1");
assert(stage2Analysis.summary.totalQuestions === 5, "Stage 2 totalQuestions should be 5");
assert(stage2Analysis.summary.totalMistakes === 3, "Stage 2 totalMistakes should be 3");
assert(stage2Analysis.summary.overallAccuracy === 40, "Stage 2 accuracy should be 40%");

const s2Hashing = stage2Analysis.concepts.find((c) => c.concept === "Hashing");
assert(s2Hashing.accuracy === 0, "Hashing accuracy in stage 2 should be 0%");
assert(s2Hashing.mistakeCount === 2, "Hashing mistakes in stage 2 should be 2");
assert(s2Hashing.learningPriority === "HIGH PRIORITY", "Hashing should be HIGH PRIORITY");

const s2Arrays = stage2Analysis.concepts.find((c) => c.concept === "Arrays");
assert(s2Arrays.accuracy === 100, "Arrays accuracy should be 100%");
assert(s2Arrays.learningPriority === "LOWER PRIORITY / STRONG", "Arrays should be LOWER PRIORITY / STRONG");

console.log("✓ Stage 2 Passed: Single assessment telemetry accurately categorized");

// -------------------------------------------------------------
// STAGE 3: User with Multiple Assessments (Recurring Weaknesses)
// -------------------------------------------------------------
console.log("\n[Stage 3] Testing Multi-Assessment Longitudinal Pattern Detection...");
const attempt2 = {
  _id: "attempt_002",
  assessmentTitle: "Hashing & Maps Deep Dive",
  assessmentCategory: "Data Structures",
  assessmentField: "Computer Science",
  scorePercent: 33,
  totalQuestions: 3,
  correctCount: 1,
  completedAt: new Date("2026-09-08T14:00:00Z"),
  questionResults: [
    {
      questionId: "q6",
      questionText: "Explain how two sum problem is solved in O(n) time",
      topic: "Data Structures",
      concept: "Hashing",
      difficulty: "Hard",
      isCorrect: false,
      status: "incorrect",
      mistakeType: "LOGICAL",
      userAnswer: "Nested loops",
      correctAnswer: "Frequency map hash table lookup",
    },
    {
      questionId: "q7",
      questionText: "What is hash collision?",
      topic: "Data Structures",
      concept: "Hashing",
      difficulty: "Medium",
      isCorrect: false,
      status: "incorrect",
      mistakeType: "CONCEPTUAL",
      userAnswer: "Memory overflow",
      correctAnswer: "Two keys hashing to the same slot",
    },
    {
      questionId: "q8",
      questionText: "Hash map average insertion time",
      topic: "Data Structures",
      concept: "Hashing",
      difficulty: "Easy",
      isCorrect: true,
      status: "correct",
      mistakeType: "",
    },
  ],
};

const attempt3 = {
  _id: "attempt_003",
  assessmentTitle: "Full Mock Test",
  assessmentCategory: "Data Structures",
  assessmentField: "Computer Science",
  scorePercent: 80,
  totalQuestions: 5,
  correctCount: 4,
  completedAt: new Date("2026-09-15T18:00:00Z"),
  questionResults: [
    {
      questionId: "q9",
      concept: "Arrays",
      topic: "Data Structures",
      difficulty: "Medium",
      isCorrect: true,
      status: "correct",
      mistakeType: "",
    },
    {
      questionId: "q10",
      concept: "Arrays",
      topic: "Data Structures",
      difficulty: "Hard",
      isCorrect: true,
      status: "correct",
      mistakeType: "",
    },
    {
      questionId: "q11",
      concept: "Binary Search",
      topic: "Algorithms",
      difficulty: "Medium",
      isCorrect: true,
      status: "correct",
      mistakeType: "",
    },
    {
      questionId: "q12",
      concept: "Binary Search",
      topic: "Algorithms",
      difficulty: "Hard",
      isCorrect: true,
      status: "correct",
      mistakeType: "",
    },
    {
      questionId: "q13",
      concept: "Hashing",
      topic: "Data Structures",
      difficulty: "Hard",
      isCorrect: false,
      status: "incorrect",
      mistakeType: "CONCEPTUAL",
    },
  ],
};

const stage3Analysis = buildMistakeMapAnalysis([attempt1, attempt2, attempt3], { careerGoal: "Backend Engineer" });
assert(stage3Analysis.totalAttempts === 3, "Stage 3 totalAttempts should be 3");
assert(stage3Analysis.summary.totalQuestions === 13, "Stage 3 totalQuestions should be 13");
assert(stage3Analysis.summary.totalCorrect === 7, "Stage 3 totalCorrect should be 7");
assert(stage3Analysis.summary.totalMistakes === 6, "Stage 3 totalMistakes should be 6");

// Hashing across 3 attempts: total 6 questions (1 correct, 5 mistakes = 17% accuracy)
const s3Hashing = stage3Analysis.concepts.find((c) => c.concept === "Hashing");
assert(s3Hashing !== undefined, "Hashing concept must exist in stage 3");
assert(s3Hashing.totalAttempts === 6, "Hashing attempts should be 6");
assert(s3Hashing.mistakeCount === 5, "Hashing mistakes should be 5");
assert(s3Hashing.accuracy === 17, "Hashing accuracy should be 17%");
assert(s3Hashing.isRecurringWeakness === true, "Hashing MUST be flagged as recurring weakness");
assert(s3Hashing.learningPriority === "HIGH PRIORITY", "Hashing MUST be HIGH PRIORITY");
assert(s3Hashing.primaryMistakeType === "CONCEPTUAL", "Hashing dominant mistake should be CONCEPTUAL");

// Arrays across 3 attempts: total 4 questions (4 correct, 0 mistakes = 100% accuracy)
const s3Arrays = stage3Analysis.concepts.find((c) => c.concept === "Arrays");
assert(s3Arrays.accuracy === 100, "Arrays should be 100%");
assert(s3Arrays.learningPriority === "LOWER PRIORITY / STRONG", "Arrays should be LOWER PRIORITY / STRONG");

// Binary Search across 3 attempts: total 3 questions (2 correct, 1 mistake = 67% accuracy)
const s3BS = stage3Analysis.concepts.find((c) => c.concept === "Binary Search");
assert(s3BS.accuracy === 67, "Binary Search accuracy should be 67%");
assert(s3BS.trend === "improving", "Binary Search should be improving (0% initially → 100% recently)");

// Priority ordering check
assert(stage3Analysis.highPriorityConcepts[0].concept === "Hashing", "Highest priority concept must be Hashing");

// AI Insights with Stage 3 data
const stage3AI = await generateMistakeMapInsightsWithAI(stage3Analysis, { careerGoal: "Backend Engineer" });
assert(stage3AI.isInsufficientData === false, "Stage 3 AI should have isInsufficientData: false");
assert(stage3AI.focusMore.some((f) => f.concept === "Hashing"), "AI recommendations must highlight Hashing");
assert(stage3AI.lowerPriority.some((l) => l.concept === "Arrays"), "AI recommendations must mark Arrays as lower priority / mastered");

console.log("✓ Stage 3 Passed: Longitudinal recurring weaknesses, trends, and AI recommendations validated!");
console.log("\n=================================================");
console.log(" ✅ ALL MISTAKE MAP INTEGRATION TESTS PASSED!");
console.log("=================================================");
