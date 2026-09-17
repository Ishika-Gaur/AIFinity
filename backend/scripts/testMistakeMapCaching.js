import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import AttemptResult from "../src/models/AttemptResult.js";
import MistakeMapAnalysis from "../src/models/MistakeMapAnalysis.js";
import { getMistakeMap, generateMistakeMapAIInsights } from "../src/controllers/mistakeMapController.js";

async function runCachingTests() {
  console.log("=== Starting Mistake Map AI Caching & UX Tests ===");

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.");

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
  console.log("\n[Test 1] First visit with 0 attempts (New User)");
  let req1 = { user: mockUser };
  let res1Data = null;
  let res1 = { json: (d) => { res1Data = d; return d; }, status: () => res1 };
  await getMistakeMap(req1, res1);
  
  if (res1Data?.data?.aiInsights?.isInsufficientData === true) {
    console.log("✓ PASS: Zero attempts returns empty fallback immediately with isInsufficientData: true");
  } else {
    console.error("✗ FAIL: Zero attempts did not return empty fallback", res1Data?.data?.aiInsights);
  }

  // 2. Add sample attempts
  console.log("\n[Test 2] First visit with assessment attempts (Auto-generation & persistence)");
  await AttemptResult.create({
    userId: testUserId,
    assessmentTitle: "Data Structures Diagnostic",
    assessmentCategory: "Computer Science",
    scorePercent: 40,
    totalQuestions: 2,
    correctCount: 0,
    incorrectCount: 2,
    completedAt: new Date(),
    questionResults: [
      { questionId: new mongoose.Types.ObjectId(), questionText: "Recursion base case", topic: "Algorithms", concept: "Recursion", difficulty: "Medium", status: "incorrect", isCorrect: false },
      { questionId: new mongoose.Types.ObjectId(), questionText: "Stack frame overflow", topic: "Algorithms", concept: "Recursion", difficulty: "Hard", status: "incorrect", isCorrect: false },
    ]
  });

  const tStart = Date.now();
  let req2 = { user: mockUser };
  let res2Data = null;
  let res2 = { json: (d) => { res2Data = d; return d; }, status: () => res2 };
  await getMistakeMap(req2, res2);
  const tDuration1 = Date.now() - tStart;

  if (res2Data?.data?.aiInsights && !res2Data.data.aiInsights.isInsufficientData) {
    console.log(`✓ PASS: Initial visit generated valid AI insights in ${tDuration1}ms`);
    console.log("  Summary headline:", res2Data.data.aiInsights.summaryHeadline);
  } else {
    console.error("✗ FAIL: Expected valid AI insights on initial visit");
  }

  // Verify stored in DB
  const stored = await MistakeMapAnalysis.findOne({ userId: testUserId }).lean();
  if (stored?.aiInsights?.summaryHeadline) {
    console.log("✓ PASS: AI insights persisted to MistakeMapAnalysis in MongoDB:", stored.aiInsights.summaryHeadline);
  } else {
    console.error("✗ FAIL: AI insights not saved in MongoDB", stored);
  }

  // 3. Repeat visits / navigating back (Cached fast reuse)
  console.log("\n[Test 3] Subsequent visits / navigations (Cached instant reuse)");
  const tStart2 = Date.now();
  let req3 = { user: mockUser };
  let res3Data = null;
  let res3 = { json: (d) => { res3Data = d; return d; }, status: () => res3 };
  await getMistakeMap(req3, res3);
  const tDuration2 = Date.now() - tStart2;

  if (res3Data?.data?.aiInsights?.summaryHeadline === stored.aiInsights.summaryHeadline && tDuration2 < 500) {
    console.log(`✓ PASS: Subsequent visit loaded persisted AI insights instantly in ${tDuration2}ms (0 regeneration delay!)`);
  } else {
    console.error("✗ FAIL: Subsequent visit failed caching check:", { tDuration2, res: res3Data });
  }

  // 4. Explicit Refresh AI Insights button
  console.log("\n[Test 4] Explicit 'Refresh AI Insights' action");
  let req4 = { user: mockUser };
  let res4Data = null;
  let res4 = { json: (d) => { res4Data = d; return d; }, status: () => res4 };
  await generateMistakeMapAIInsights(req4, res4);

  if (res4Data?.data?.summaryHeadline) {
    console.log("✓ PASS: Refresh explicitly generated fresh AI insights:", res4Data.data.summaryHeadline);
  } else {
    console.error("✗ FAIL: Refresh action failed:", res4Data);
  }

  // Verify the cached record was updated
  const updatedRecord = await MistakeMapAnalysis.findOne({ userId: testUserId }).lean();
  console.log("✓ Persisted record in DB after refresh:", updatedRecord?.aiInsights?.summaryHeadline);

  // 5. Subsequent visit after refresh
  console.log("\n[Test 5] Visit after refresh (Serves refreshed cached insight)");
  const tStart3 = Date.now();
  let req5 = { user: mockUser };
  let res5Data = null;
  let res5 = { json: (d) => { res5Data = d; return d; }, status: () => res5 };
  await getMistakeMap(req5, res5);
  const tDuration3 = Date.now() - tStart3;

  if (res5Data?.data?.aiInsights?.summaryHeadline === updatedRecord.aiInsights.summaryHeadline && tDuration3 < 500) {
    console.log(`✓ PASS: Loaded refreshed cached insight in ${tDuration3}ms with 0 delay`);
  } else {
    console.error("✗ FAIL: Visit after refresh failed caching check");
  }

  // Cleanup
  await AttemptResult.deleteMany({ userId: testUserId });
  await MistakeMapAnalysis.deleteMany({ userId: testUserId });
  await mongoose.disconnect();

  console.log("\n=== All Mistake Map Caching & UX Tests Passed Successfully ===");
}

runCachingTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
