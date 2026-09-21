import mongoose from "mongoose";
import dotenv from "dotenv";
import AttemptResult from "./src/models/AttemptResult.js";
import User from "./src/models/User.js";
import { calculateConceptRoot } from "./src/services/conceptRootService.js";
import { explainConceptRootWithAI } from "./src/services/geminiService.js";
import ConceptRootAnalysis from "./src/models/ConceptRootAnalysis.js";

dotenv.config();

async function runTest() {
  console.log("Connecting to local MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cognifyAi", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected.\n");

  try {
    // 1. Create a dummy user
    const testUser = await User.findOneAndUpdate(
      { email: "test-phase4@example.com" },
      { name: "Phase4 Tester", password: "hash", role: "student" },
      { upsert: true, new: true }
    );

    console.log("Test user ID:", testUser._id);

    // 2. Clear old attempts for this user
    await AttemptResult.deleteMany({ userId: testUser._id });

    // 3. Insert mock attempts testing EDGE CASE and PREREQUISITE GAPs
    // Attempt 1: Binary Search basic success
    await AttemptResult.create({
      userId: testUser._id,
      assessmentCategory: "Algorithms",
      assessmentTitle: "Binary Search Basics",
      scorePercent: 100,
      totalQuestions: 2,
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      questionResults: [
        {
          questionId: "q1",
          concept: "binary-search",
          difficulty: "Medium",
          status: "correct",
          isCorrect: true,
          userAnswer: "O(log n)",
          correctAnswer: "O(log n)",
          questionText: "What is the time complexity of binary search?"
        },
        {
          questionId: "q2",
          concept: "binary-search",
          difficulty: "Medium",
          status: "correct",
          isCorrect: true,
          userAnswer: "mid = (low + high) / 2",
          correctAnswer: "mid = (low + high) / 2",
          questionText: "How do you find the mid element?"
        }
      ]
    });

    // Attempt 2: Binary Search edge-cases fail + boundary-handling fails
    await AttemptResult.create({
      userId: testUser._id,
      assessmentCategory: "Algorithms",
      assessmentTitle: "Advanced Binary Search",
      scorePercent: 0,
      totalQuestions: 2,
      completedAt: new Date(), // Today
      questionResults: [
        {
          questionId: "q3",
          concept: "binary-search",
          difficulty: "Hard",
          status: "incorrect",
          isCorrect: false,
          userAnswer: "low = mid",
          correctAnswer: "low = mid + 1",
          questionText: "Update the boundary when the element is greater." // "boundary" keyword -> boundary-handling
        },
        {
          questionId: "q4",
          concept: "boundary-handling",
          difficulty: "Hard",
          status: "incorrect",
          isCorrect: false,
          userAnswer: "0",
          correctAnswer: "-1",
          questionText: "What boundary should you return if the element is not found?"
        }
      ]
    });

    console.log("Mock attempts created. Running calculateConceptRoot...");

    // 4. Test deterministic engine
    const deterministicData = await calculateConceptRoot(testUser._id);
    
    console.log("\n--- DETERMINISTIC RESULT ---");
    console.log(JSON.stringify(deterministicData, null, 2));

    if (deterministicData.gapAnalysis.gapType !== "PREREQUISITE_GAP") {
      console.warn("\n⚠️ WARNING: Engine did not correctly identify PREREQUISITE_GAP!");
    } else {
      console.log(`\n✅ SUCCESS: Engine identified ${deterministicData.gapAnalysis.gapType}. Traced '${deterministicData.observedConcept.id}' to '${deterministicData.rootConcept.id}'.`);
    }

    // 5. Test AI explanation boundary
    console.log("\nTriggering Gemini for explanation ONLY...");
    const aiInsights = await explainConceptRootWithAI(deterministicData);

    console.log("\n--- AI EXPLANATION ---");
    console.log(JSON.stringify(aiInsights, null, 2));

    console.log("\nTest complete.");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    mongoose.connection.close();
  }
}

runTest();
