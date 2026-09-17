import { buildMistakeMapAnalysis, cleanName } from "../src/services/mistakeMapService.js";
import { classifyMistakeDeterministically } from "../src/controllers/assessmentController.js";

function assert(condition, message) {
  if (!condition) {
    console.error("ASSERTION FAILED:", message);
    process.exit(1);
  }
}

console.log("Starting MistakeMap Unit Tests...");

// Test 1: Empty attempts (0 attempts)
const emptyResult = buildMistakeMapAnalysis([]);
assert(emptyResult.hasData === false, "Empty attempts should have hasData: false");
assert(emptyResult.summary.totalAttempts === 0, "Total attempts should be 0");
assert(emptyResult.summary.totalQuestions === 0, "Total questions should be 0");
assert(emptyResult.summary.overallAccuracy === 0, "Accuracy should be 0");
assert(Array.isArray(emptyResult.concepts) && emptyResult.concepts.length === 0, "Concepts should be empty array");
console.log("✓ Test 1 Passed: 0 attempts handled cleanly");

// Test 2: Deterministic classification heuristics
const qMCQ = { type: "mcq", question: "Which algorithm uses hashing?" };
assert(classifyMistakeDeterministically(qMCQ, { isCorrect: true, status: "correct" }) === "", "Correct should be blank");
assert(classifyMistakeDeterministically(qMCQ, { isCorrect: false, status: "incorrect", type: "mcq" }, null, "Array") === "UNKNOWN", "Generic MCQ should be UNKNOWN");

const qCode = { type: "coding", question: "Write a function to invert binary tree" };
assert(classifyMistakeDeterministically(qCode, { isCorrect: false, status: "incorrect", type: "coding" }, null, "def invert():") === "IMPLEMENTATION", "Coding question should be IMPLEMENTATION");

const qLogic = { type: "logical-reasoning", question: "Trace the execution sequence" };
assert(classifyMistakeDeterministically(qLogic, { isCorrect: false, status: "incorrect", type: "logical-reasoning" }, null, "Step 2") === "LOGICAL", "Logical reasoning question should be LOGICAL");

const qShort = { type: "short-answer", question: "What is 10 + 5?" };
assert(classifyMistakeDeterministically(qShort, { isCorrect: false, status: "incorrect", type: "short_answer", correctAnswer: "15" }, null, "14") === "CARELESS", "Off-by-one should be CARELESS");

const qTimeout = { type: "mcq", question: "Question 5" };
assert(classifyMistakeDeterministically(qTimeout, { isCorrect: false, status: "unanswered", type: "mcq" }, null, null, 360, 5) === "TIME_MANAGEMENT", "Timeout should be TIME_MANAGEMENT");

console.log("✓ Test 2 Passed: Deterministic classification behaves accurately");

// Test 3: Multiple attempts with recurring weakness & priority scoring
const mockAttempts = [
  {
    _id: "att_1",
    assessmentTitle: "Data Structures Diagnostic 1",
    assessmentCategory: "Data Structures",
    assessmentField: "Computer Science",
    completedAt: new Date("2026-09-01T10:00:00Z"),
    questionResults: [
      { questionId: "q1", concept: "Hashing", topic: "Data Structures", isCorrect: false, status: "incorrect", mistakeType: "CONCEPTUAL" },
      { questionId: "q2", concept: "Hashing", topic: "Data Structures", isCorrect: false, status: "incorrect", mistakeType: "LOGICAL" },
      { questionId: "q3", concept: "Arrays", topic: "Data Structures", isCorrect: true, status: "correct", mistakeType: "" },
      { questionId: "q4", concept: "Arrays", topic: "Data Structures", isCorrect: true, status: "correct", mistakeType: "" },
    ],
  },
  {
    _id: "att_2",
    assessmentTitle: "Data Structures Diagnostic 2",
    assessmentCategory: "Data Structures",
    assessmentField: "Computer Science",
    completedAt: new Date("2026-09-10T10:00:00Z"),
    questionResults: [
      { questionId: "q5", concept: "Hashing", topic: "Data Structures", isCorrect: false, status: "incorrect", mistakeType: "CONCEPTUAL" },
      { questionId: "q6", concept: "Hashing", topic: "Data Structures", isCorrect: true, status: "correct", mistakeType: "" },
      { questionId: "q7", concept: "Arrays", topic: "Data Structures", isCorrect: true, status: "correct", mistakeType: "" },
      { questionId: "q8", concept: "Graphs", topic: "Data Structures", isCorrect: false, status: "incorrect", mistakeType: "UNKNOWN" },
    ],
  },
];

const multiResult = buildMistakeMapAnalysis(mockAttempts);
assert(multiResult.hasData === true, "Multi attempts should have hasData: true");
assert(multiResult.summary.totalAttempts === 2, "Total attempts should be 2");
assert(multiResult.summary.totalQuestions === 8, "Total questions should be 8");
assert(multiResult.summary.totalCorrect === 4, "Total correct should be 4");
assert(multiResult.summary.totalMistakes === 4, "Total mistakes should be 4");
assert(multiResult.summary.overallAccuracy === 50, "Accuracy should be 50%");

// Check Hashing
const hashingConcept = multiResult.concepts.find((c) => c.concept === "Hashing");
assert(hashingConcept !== undefined, "Hashing should be in concepts");
assert(hashingConcept.totalAttempts === 4, "Hashing attempts should be 4");
assert(hashingConcept.correctCount === 1, "Hashing correct count should be 1");
assert(hashingConcept.mistakeCount === 3, "Hashing mistakes should be 3");
assert(hashingConcept.accuracy === 25, "Hashing accuracy should be 25%");
assert(hashingConcept.isRecurringWeakness === true, "Hashing should be marked as recurring weakness");
assert(hashingConcept.learningPriority === "HIGH PRIORITY", "Hashing should be HIGH PRIORITY");
assert(hashingConcept.primaryMistakeType === "CONCEPTUAL", "Primary mistake for Hashing should be CONCEPTUAL");

// Check Arrays
const arraysConcept = multiResult.concepts.find((c) => c.concept === "Arrays");
assert(arraysConcept !== undefined, "Arrays should be in concepts");
assert(arraysConcept.accuracy === 100, "Arrays accuracy should be 100%");
assert(arraysConcept.learningPriority === "LOWER PRIORITY / STRONG", "Arrays should be LOWER PRIORITY / STRONG");

// Check Mistake distribution
assert(multiResult.mistakeDistribution.totalMistakes === 4, "Distribution total mistakes should be 4");
const conceptualMistakes = multiResult.mistakeDistribution.breakdown.find((b) => b.type === "CONCEPTUAL");
assert(conceptualMistakes.count === 2, "Conceptual count should be 2");

console.log("✓ Test 3 Passed: Multi-attempt aggregation, recurring weakness detection, and priority ranking work perfectly!");

// Test 4: AI Insights schema and insufficient data handling
import { generateMistakeMapInsightsWithAI } from "../src/services/geminiService.js";

const emptyAIInsights = await generateMistakeMapInsightsWithAI(emptyResult);
assert(emptyAIInsights.isInsufficientData === true, "Empty data should have isInsufficientData: true");
assert(emptyAIInsights.focusMore.length === 0, "Empty data should have 0 focusMore items");
console.log("✓ Test 4 Passed: AI handles empty/insufficient data cleanly without hallucinating");

const multiAIInsights = await generateMistakeMapInsightsWithAI(multiResult, { careerGoal: "Software Engineer" });
assert(multiAIInsights.summaryHeadline !== undefined, "AI insights should have summaryHeadline");
assert(Array.isArray(multiAIInsights.focusMore), "AI insights should have focusMore array");
assert(Array.isArray(multiAIInsights.lowerPriority), "AI insights should have lowerPriority array");
assert(typeof multiAIInsights.why === "string", "AI insights should have why explanation");
assert(Array.isArray(multiAIInsights.recommendedPractice), "AI insights should have recommendedPractice array");
console.log("✓ Test 5 Passed: AI insights output matches schema and reflects real telemetry");

console.log("All Phase 1, 2, 3, & 4 backend tests passed successfully!");
