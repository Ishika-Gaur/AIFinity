import mongoose from 'mongoose';
import { calculateSkillGap } from './src/services/skillGapService.js';
import AttemptResult from './src/models/AttemptResult.js';

async function runTests() {
  await mongoose.connect('mongodb://localhost:27017/cognifyAi');
  
  const testUserId = "64e837a54cf8e30b6c6b3e32";

  // Clean db attempts to ensure fresh state
  await AttemptResult.deleteMany({ userId: testUserId });
  
  // Test 1-6, 12, 13 (Deterministic, No AI Dependency, Evidence Count, Unmapped, Confidence, Weighting)
  // Create an attempt
  await AttemptResult.create({
    userId: testUserId,
    assessmentId: new mongoose.Types.ObjectId(),
    assessmentTitle: "Mock Test",
    assessmentCategory: "Technology",
    totalQuestions: 3,
    scorePercent: 50,
    timeTaken: 120,
    completedAt: new Date(),
    questionResults: [
      {
        questionId: "q1",
        questionText: "What is JS?",
        type: "mcq",
        userAnswer: 0,
        correctAnswer: 0,
        isCorrect: true,
        marksAwarded: 1,
        maxMarks: 1,
        status: "correct",
        difficulty: "Medium",
        canonicalConcept: "js.basics",
        canonicalSkill: "JavaScript"
      },
      {
        questionId: "q2",
        questionText: "Unanswered?",
        type: "mcq",
        userAnswer: -1,
        correctAnswer: 1,
        isCorrect: false,
        marksAwarded: 0,
        maxMarks: 1,
        status: "unanswered",
        difficulty: "Hard",
        canonicalConcept: "js.advanced",
        canonicalSkill: "JavaScript"
      },
      {
        questionId: "q3",
        questionText: "No mapped skill",
        type: "mcq",
        userAnswer: 0,
        correctAnswer: 0,
        isCorrect: true,
        marksAwarded: 1,
        maxMarks: 1,
        status: "correct",
        difficulty: "Easy",
        canonicalConcept: "random.concept",
        canonicalSkill: "nonexistent.skill"
      }
    ]
  });

  const gapData = await calculateSkillGap(testUserId, "Software Developer");
  
  console.log("=== PHASE 2B TESTS ===");
  console.log("Has Data:", gapData.hasData);
  console.log("Source Attempts:", gapData.sourceAttemptCount);
  console.log("Unmapped Evidence Count:", gapData.unmappedEvidenceCount);
  console.log("Metrics:", JSON.stringify(gapData.metrics, null, 2));

  // The 'Programming' skill should have:
  // Σ marksAwarded = 1 (q1) + 0 (q2 - unanswered is 0)
  // Σ maxMarks = 1 (q1) + 1 (q2)
  // Current performance = 1 / 2 = 50%
  // Required for Software Developer = 85 (Target Baseline) - Medium (-0) - Hard (+5)
  // Wait, target defaults to 80-85, let's just see what the output is.
  // API Controller Test
  const { getSkillGap } = await import('./src/controllers/skillGapController.js');
  
  const req = {
    user: {
      _id: testUserId,
      name: "Test User",
      email: "test@example.com",
      selectedField: "Software Developer"
    }
  };
  
  const res = {
    json: (data) => {
      console.log("\n=== CONTROLLER API TEST ===");
      console.log("Success:", data.success);
      console.log("Data hasData:", data.data.hasData);
      console.log("Metrics Count:", data.data.skills?.allMetrics?.length);
      console.log("AI Status:", data.data.skills?.aiStatus);
    }
  };

  await getSkillGap(req, res);
  
  await mongoose.disconnect();
}

runTests().catch(console.error);
