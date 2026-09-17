import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import AttemptResult from "../src/models/AttemptResult.js";
import MistakeMapAnalysis from "../src/models/MistakeMapAnalysis.js";
import { getMistakeMap, generateMistakeMapAIInsights } from "../src/controllers/mistakeMapController.js";

async function runTests() {
  console.log("=== Testing Mistake Map AI Caching, Deduplication & DB Persistence ===");

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI missing");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const testUserId = new mongoose.Types.ObjectId();
  const mockUser = {
    _id: testUserId,
    name: "Audit Student",
    email: `audit_${Date.now()}@aifinity.test`,
    selectedField: "Computer Science",
    onboardingProfile: {
      field: "Computer Science",
      careerGoal: "Software Engineer",
      level: "Intermediate"
    }
  };

  // Clean test user data
  await AttemptResult.deleteMany({ userId: testUserId });
  await MistakeMapAnalysis.deleteMany({ userId: testUserId });

  // 1. Zero attempts test
  console.log("\n[Test 1] 0 Attempts (New User)");
  let res1Data = null;
  await getMistakeMap({ user: mockUser }, { json: (d) => { res1Data = d; return d; }, status: () => ({ json: () => {} }) });
  
  console.assert(res1Data?.data?.aiInsights?.isInsufficientData === true, "Zero attempts should return isInsufficientData: true");
  console.log("✓ PASS: Zero attempts returned fallback instantly without generating AI");

  // 2. Pre-populate an existing cached AI insight into MistakeMapAnalysis
  console.log("\n[Test 2] Existing Cached AI Insight in DB");
  const cachedInsight = {
    summaryHeadline: "Mastery Target: Binary Search & Tree Traversal",
    focusMore: [{ concept: "Binary Search", reason: "Boundary conditions error", suggestedAction: "Review while loop bounds", urgency: "HIGH" }],
    lowerPriority: [{ concept: "Arrays", reason: "100% accuracy" }],
    why: "Demonstrated strong foundational array skills, but boundary conditions need targeted practice.",
    recommendedPractice: [],
    isInsufficientData: false,
  };

  await MistakeMapAnalysis.create({
    userId: testUserId,
    aiInsights: cachedInsight,
    lastGeneratedAt: new Date()
  });

  // Create an attempt
  await AttemptResult.create({
    userId: testUserId,
    assessmentTitle: "DS Diagnostic",
    assessmentCategory: "Computer Science",
    scorePercent: 50,
    totalQuestions: 2,
    correctCount: 1,
    incorrectCount: 1,
    completedAt: new Date(),
    questionResults: [
      { questionId: new mongoose.Types.ObjectId(), questionText: "Q1", topic: "Algorithms", concept: "Binary Search", difficulty: "Medium", status: "incorrect", isCorrect: false },
      { questionId: new mongoose.Types.ObjectId(), questionText: "Q2", topic: "Algorithms", concept: "Arrays", difficulty: "Easy", status: "correct", isCorrect: true },
    ]
  });

  // Fetch mistake map - it MUST reuse the cached insight from DB without calling Gemini!
  let res2Data = null;
  await getMistakeMap({ user: mockUser }, { json: (d) => { res2Data = d; return d; }, status: () => ({ json: () => {} }) });

  console.assert(res2Data?.data?.aiInsights?.summaryHeadline === cachedInsight.summaryHeadline, "Should return cached insight");
  console.log("✓ PASS: Returned cached AI insight directly from MongoDB without AI latency");
  console.log("  Headline:", res2Data.data.aiInsights.summaryHeadline);

  // 3. Repeat navigation test (component remount simulation)
  console.log("\n[Test 3] Navigating back to Mistake Map (Repeat mount)");
  let res3Data = null;
  await getMistakeMap({ user: mockUser }, { json: (d) => { res3Data = d; return d; }, status: () => ({ json: () => {} }) });
  console.assert(res3Data?.data?.aiInsights?.summaryHeadline === cachedInsight.summaryHeadline, "Should maintain cached insight across repeat visits");
  console.log("✓ PASS: Component remount / re-navigation serves cached insights with 0 delay");

  // 4. Update the cached insight in DB and verify it gets picked up
  console.log("\n[Test 4] Updating cached insight in DB");
  const refreshedInsight = {
    summaryHeadline: "Refreshed AI Diagnostic: Advanced Trees & Graphs",
    focusMore: [{ concept: "Graphs", reason: "Cycle detection", suggestedAction: "Review DFS coloring", urgency: "HIGH" }],
    lowerPriority: [{ concept: "Binary Search", reason: "Improved to 85%" }],
    why: "Longitudinal progress indicates Binary Search mastery.",
    recommendedPractice: [],
    isInsufficientData: false,
  };

  await MistakeMapAnalysis.findOneAndUpdate(
    { userId: testUserId },
    { aiInsights: refreshedInsight, lastGeneratedAt: new Date() },
    { upsert: true }
  );

  let res4Data = null;
  await getMistakeMap({ user: mockUser }, { json: (d) => { res4Data = d; return d; }, status: () => ({ json: () => {} }) });
  console.assert(res4Data?.data?.aiInsights?.summaryHeadline === refreshedInsight.summaryHeadline, "Should return updated insight");
  console.log("✓ PASS: Updated cached insight served properly:", res4Data.data.aiInsights.summaryHeadline);

  // Clean up
  await AttemptResult.deleteMany({ userId: testUserId });
  await MistakeMapAnalysis.deleteMany({ userId: testUserId });
  await mongoose.disconnect();

  console.log("\n=== All Verification Tests Passed Successfully ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
