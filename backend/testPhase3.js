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
    // 1. Create a test user
    const testUser = await User.findOneAndUpdate(
      { email: "test-phase3@example.com" },
      { name: "Phase 3 Tester", email: "test-phase3@example.com", password: "hash" },
      { upsert: true, new: true }
    );
    console.log(`Test user ID: ${testUser._id}`);

    // 2. Clear old attempts and cache
    await AttemptResult.deleteMany({ userId: testUser._id });
    await ConceptRootAnalysis.deleteMany({ userId: testUser._id });

    // 3. Insert mock evidence showing a chained failure:
    // The student struggles with "react-hooks", but earlier they also struggled with "javascript-closures"
    
    // Attempt 1: Javascript Basics (Fails closures)
    await AttemptResult.create({
      userId: testUser._id,
      assessmentCategory: "JavaScript",
      assessmentTitle: "JS Fundamentals",
      scorePercent: 40,
      totalQuestions: 3,
      completedAt: new Date(Date.now() - 1000000),
      questionResults: [
        {
          questionId: "q1",
          questionText: "What does this closure output?",
          concept: "javascript-closures",
          isCorrect: false,
          userAnswer: "undefined",
          correctAnswer: "3",
          difficulty: "Medium",
          status: "incorrect"
        },
        {
          questionId: "q2",
          questionText: "How do you create a closure?",
          concept: "javascript-closures",
          isCorrect: false,
          userAnswer: "I don't know",
          correctAnswer: "Return a function from a function",
          difficulty: "Hard",
          status: "incorrect"
        },
        {
          questionId: "q3",
          questionText: "Variables vs Let",
          concept: "javascript-variables",
          isCorrect: true,
          userAnswer: "let is block scoped",
          correctAnswer: "let is block scoped",
          difficulty: "Easy",
          status: "correct"
        }
      ]
    });

    // Attempt 2: React (Fails hooks)
    await AttemptResult.create({
      userId: testUser._id,
      assessmentCategory: "React",
      assessmentTitle: "React Advanced",
      scorePercent: 50,
      totalQuestions: 3,
      completedAt: new Date(),
      questionResults: [
        {
          questionId: "q4",
          questionText: "Why is the state stale inside this useEffect?",
          concept: "react-hooks",
          isCorrect: false,
          userAnswer: "useEffect is broken",
          correctAnswer: "The closure captured a stale state variable",
          difficulty: "Hard",
          status: "incorrect"
        },
        {
          questionId: "q5",
          questionText: "How do you update state?",
          concept: "react-state",
          isCorrect: true,
          userAnswer: "setState()",
          correctAnswer: "setState()",
          difficulty: "Easy",
          status: "correct"
        },
        {
          questionId: "q6",
          questionText: "When does useMemo re-evaluate?",
          concept: "react-hooks",
          isCorrect: false,
          userAnswer: "On every render",
          correctAnswer: "When dependencies change",
          difficulty: "Medium",
          status: "incorrect"
        }
      ]
    });

    console.log("Mock attempts created. Running calculateConceptRoot...");

    // 4. Test deterministic engine
    const deterministicData = await calculateConceptRoot(testUser._id);
    
    console.log("\n--- DETERMINISTIC RESULT ---");
    console.log(JSON.stringify(deterministicData, null, 2));

    if (deterministicData.rootCause.rootConceptId !== "javascript-closures") {
      console.warn("\n⚠️ WARNING: Engine did not correctly identify 'javascript-closures' as the root cause!");
    } else {
      console.log("\n✅ SUCCESS: Engine traced 'react-hooks' back to 'javascript-closures'.");
      console.log("   Observed Mastery:", JSON.stringify(deterministicData.mastery));
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
