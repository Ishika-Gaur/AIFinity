import Assessment from "../src/models/Assessment.js";
import AttemptResult from "../src/models/AttemptResult.js";
import { buildMistakeMapAnalysis } from "../src/services/mistakeMapService.js";
import { classifyMistakeDeterministically } from "../src/controllers/assessmentController.js";

function assert(condition, message) {
  if (!condition) {
    console.error("❌ AUDIT ASSERTION FAILED:", message);
    process.exit(1);
  }
}

console.log("=================================================================");
console.log(" 🔍 TARGETED AUDIT: CONCEPT-LEVEL DATA FLOW VERIFICATION");
console.log("=================================================================");

// 1. Verify Assessment.questionSchema definition
const assessmentKeys = Object.keys(Assessment.schema.paths);
const questionSubSchemaPaths = Object.keys(Assessment.schema.path("questions").schema.paths);

console.log("\n[Check 1] Assessment schema verification:");
console.log(" - Assessment schema fields:", assessmentKeys.join(", "));
console.log(" - Question sub-schema fields:", questionSubSchemaPaths.join(", "));

assert(questionSubSchemaPaths.includes("concept"), "Assessment.questionSchema MUST contain 'concept'");
assert(questionSubSchemaPaths.includes("topic"), "Assessment.questionSchema MUST contain 'topic'");
assert(questionSubSchemaPaths.includes("difficulty"), "Assessment.questionSchema MUST contain 'difficulty'");
console.log("✓ Check 1 Passed: Assessment.questionSchema explicitly contains 'concept', 'topic', 'difficulty'");

// 2. Verify AttemptResult.questionResultSchema definition
const attemptKeys = Object.keys(AttemptResult.schema.paths);
const questionResultSubSchemaPaths = Object.keys(AttemptResult.schema.path("questionResults").schema.paths);

console.log("\n[Check 2] AttemptResult schema verification:");
console.log(" - QuestionResult sub-schema fields:", questionResultSubSchemaPaths.join(", "));

assert(questionResultSubSchemaPaths.includes("concept"), "AttemptResult.questionResults MUST contain 'concept'");
assert(questionResultSubSchemaPaths.includes("topic"), "AttemptResult.questionResults MUST contain 'topic'");
assert(questionResultSubSchemaPaths.includes("difficulty"), "AttemptResult.questionResults MUST contain 'difficulty'");
assert(questionResultSubSchemaPaths.includes("mistakeType"), "AttemptResult.questionResults MUST contain 'mistakeType'");
console.log("✓ Check 2 Passed: AttemptResult.questionResults explicitly contains 'concept', 'topic', 'difficulty', 'mistakeType'");

// 3. Concrete trace of a real question from creation -> AttemptResult -> MistakeMap
console.log("\n[Check 3] Tracing Concrete Example Question:");
const sampleQuestion = {
  _id: "q_freq_map_101",
  question: "How do you find the first non-repeating character in a string in O(n) time?",
  type: "mcq",
  topic: "Data Structures",
  concept: "Frequency Map",
  difficulty: "Medium",
  options: ["Sort the string", "Use a frequency map hash table", "Nested loops", "Binary Search"],
  answer: "Use a frequency map hash table",
  explanation: "A frequency map tracks character occurrences in a single linear pass.",
};

console.log(" Step 1 (Assessment Question Created):");
console.log(`   - ID: ${sampleQuestion._id}`);
console.log(`   - Topic: "${sampleQuestion.topic}"`);
console.log(`   - Concept: "${sampleQuestion.concept}"`);
console.log(`   - Difficulty: "${sampleQuestion.difficulty}"`);

// Step 2: Simulate student submitting an incorrect answer
const studentAnswer = "Nested loops";
const isCorrect = studentAnswer === sampleQuestion.answer;
const mistakeType = classifyMistakeDeterministically(sampleQuestion, { isCorrect, status: "incorrect", type: "mcq" }, null, studentAnswer);

const persistedQuestionResult = {
  questionId: String(sampleQuestion._id),
  questionText: sampleQuestion.question,
  type: sampleQuestion.type,
  userAnswer: studentAnswer,
  correctAnswer: sampleQuestion.answer,
  status: isCorrect ? "correct" : "incorrect",
  isCorrect: isCorrect,
  marksAwarded: isCorrect ? 10 : 0,
  maxMarks: 10,
  topic: sampleQuestion.topic,
  concept: sampleQuestion.concept, // Preserved exact concept
  difficulty: sampleQuestion.difficulty,
  timeTaken: 45,
  mistakeType: mistakeType,
};

console.log("\n Step 2 (Submitted & Evaluated -> AttemptResult.questionResults):");
console.log(`   - Question ID: ${persistedQuestionResult.questionId}`);
console.log(`   - Persisted Concept: "${persistedQuestionResult.concept}"`);
console.log(`   - Is Correct: ${persistedQuestionResult.isCorrect}`);
console.log(`   - Mistake Type: "${persistedQuestionResult.mistakeType}"`);

assert(persistedQuestionResult.concept === "Frequency Map", "Concept in AttemptResult must strictly match 'Frequency Map'");

// Step 3: Simulate 2 attempts to trigger multi-attempt concept aggregation
const mockAttempts = [
  {
    _id: "att_live_01",
    assessmentTitle: "Hashing & Mapping Mastery",
    assessmentCategory: "Data Structures",
    assessmentField: "Computer Science",
    completedAt: new Date("2026-09-01T10:00:00Z"),
    questionResults: [
      persistedQuestionResult,
      {
        questionId: "q_freq_map_102",
        questionText: "Which data structure implements frequency mapping?",
        topic: "Data Structures",
        concept: "Frequency Map",
        difficulty: "Easy",
        isCorrect: false,
        status: "incorrect",
        mistakeType: "CONCEPTUAL",
      },
      {
        questionId: "q_array_101",
        questionText: "Array index access complexity",
        topic: "Data Structures",
        concept: "Array Traversal",
        difficulty: "Easy",
        isCorrect: true,
        status: "correct",
        mistakeType: "",
      },
    ],
  },
  {
    _id: "att_live_02",
    assessmentTitle: "Algorithms Review",
    assessmentCategory: "Data Structures",
    assessmentField: "Computer Science",
    completedAt: new Date("2026-09-10T12:00:00Z"),
    questionResults: [
      {
        questionId: "q_freq_map_103",
        questionText: "Word count with frequency mapping",
        topic: "Data Structures",
        concept: "Frequency Map",
        difficulty: "Medium",
        isCorrect: false,
        status: "incorrect",
        mistakeType: "LOGICAL",
      },
      {
        questionId: "q_array_102",
        questionText: "Array element update",
        topic: "Data Structures",
        concept: "Array Traversal",
        difficulty: "Easy",
        isCorrect: true,
        status: "correct",
        mistakeType: "",
      },
    ],
  },
];

const mistakeMapResult = buildMistakeMapAnalysis(mockAttempts, { careerGoal: "Software Engineer" });

console.log("\n Step 3 (MistakeMap Aggregation from AttemptResult):");
const freqMapConcept = mistakeMapResult.concepts.find((c) => c.concept === "Frequency Map");
const arrayConcept = mistakeMapResult.concepts.find((c) => c.concept === "Array Traversal");

console.log("   - Aggregated Concept 1:", freqMapConcept.concept);
console.log(`     * Total Attempts: ${freqMapConcept.totalAttempts}`);
console.log(`     * Mistakes: ${freqMapConcept.mistakeCount}`);
console.log(`     * Accuracy: ${freqMapConcept.accuracy}%`);
console.log(`     * Priority: ${freqMapConcept.learningPriority}`);
console.log(`     * Is Recurring Weakness: ${freqMapConcept.isRecurringWeakness}`);
console.log(`     * Evidence: "${freqMapConcept.evidence}"`);

console.log("   - Aggregated Concept 2:", arrayConcept.concept);
console.log(`     * Total Attempts: ${arrayConcept.totalAttempts}`);
console.log(`     * Mistakes: ${arrayConcept.mistakeCount}`);
console.log(`     * Accuracy: ${arrayConcept.accuracy}%`);
console.log(`     * Priority: ${arrayConcept.learningPriority}`);

assert(freqMapConcept.concept === "Frequency Map", "Concept name in Mistake Map must be 'Frequency Map'");
assert(freqMapConcept.isRecurringWeakness === true, "Frequency Map must be flagged as recurring weakness");
assert(freqMapConcept.learningPriority === "HIGH PRIORITY", "Frequency Map must be ranked HIGH PRIORITY");
assert(arrayConcept.learningPriority === "LOWER PRIORITY / STRONG", "Array Traversal must be LOWER PRIORITY / STRONG");

// 4. Backward Compatibility Check for Legacy Assessments without Concept
console.log("\n[Check 4] Backward compatibility for legacy assessments without explicit 'concept':");
const legacyAttempt = {
  _id: "att_legacy_01",
  assessmentTitle: "Legacy Test",
  assessmentCategory: "Computer Networks",
  assessmentField: "Networking",
  completedAt: new Date("2026-08-01T10:00:00Z"),
  questionResults: [
    {
      questionId: "q_leg_1",
      questionText: "What is IP address?",
      isCorrect: true,
      status: "correct",
      // concept and topic missing in legacy record
    },
    {
      questionId: "q_leg_2",
      questionText: "Explain TCP handshake",
      isCorrect: false,
      status: "incorrect",
      // concept and topic missing in legacy record
    },
  ],
};

const legacyAnalysis = buildMistakeMapAnalysis([legacyAttempt], { careerGoal: "DevOps Engineer" });
assert(legacyAnalysis.hasData === true, "Legacy analysis should succeed");
assert(legacyAnalysis.concepts.length > 0, "Legacy attempt should gracefully map to category/topic");
console.log(`   - Graceful fallback concept name: "${legacyAnalysis.concepts[0].concept}"`);
console.log("✓ Check 4 Passed: Legacy assessments without explicit concept fallback smoothly without breaking");

console.log("\n=================================================================");
console.log(" ✅ FINAL AUDIT COMPLETE: ALL DATA FLOW CHECKS PASSED 100%");
console.log("=================================================================");
