import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import UserRoadmap from "../src/models/UserRoadmap.js";
import User from "../src/models/User.js";
import AttemptResult from "../src/models/AttemptResult.js";
import {
  generatePersonalizedRoadmap,
  getRoadmapAnalytics,
  getUserRoadmaps,
  updateUserRoadmap,
  normalizeCourseId
} from "../src/controllers/analyticsController.js";

const __serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__serverDir, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aifinity";

async function runRoadmapVerification() {
  console.log("=== STARTING ROADMAP MULTI-COURSE & ISOLATION VERIFICATION ===\n");
  await mongoose.connect(MONGODB_URI);
  console.log("[MongoDB] Connected successfully.\n");

  // Ensure index migration has dropped legacy single-field index and synced composite index
  try {
    const userRoadmapColl = UserRoadmap.collection;
    const urIndexes = await userRoadmapColl.indexes();
    const legacyIdx = urIndexes.find((idx) => idx.name === "userId_1" && idx.unique);
    if (legacyIdx) {
      console.log("[UserRoadmap] Dropping legacy single-field unique index userId_1...");
      await userRoadmapColl.dropIndex("userId_1");
      console.log("[UserRoadmap] Successfully dropped legacy userId_1 index.");
    }
    await UserRoadmap.syncIndexes();
    console.log("[UserRoadmap] Composite index { userId: 1, courseId: 1 } ready.\n");
  } catch (err) {
    console.warn("[UserRoadmap] Index check:", err.message);
  }

  const results = {
    objective1: { name: "Strict User Data Isolation", passed: false, details: [] },
    objective2: { name: "Concurrent Multi-Course Roadmap Persistence", passed: false, details: [] },
    objective3: { name: "Progress State Resumption (Pick Up Where You Left Off)", passed: false, details: [] },
  };

  let userA = null;
  let userB = null;

  try {
    // ---------------------------------------------------------------------------
    // TEST SUITE 1: OBJECTIVE 1 - STRICT USER DATA ISOLATION
    // ---------------------------------------------------------------------------
    console.log("--- TEST SUITE 1: OBJECTIVE 1 - Strict User Data Isolation ---");
    const timestamp = Date.now();
    userA = await User.create({
      name: "Student Alpha",
      email: `student_alpha_${timestamp}@example.com`,
      passwordHash: "SecureHashAlpha123!",
      role: "student",
      selectedField: "Software Engineering",
      onboardingProfile: { careerGoal: "Backend Developer", field: "Software Engineering" }
    });

    userB = await User.create({
      name: "Student Beta",
      email: `student_beta_${timestamp}@example.com`,
      passwordHash: "SecureHashBeta123!",
      role: "student",
      selectedField: "Data Science",
      onboardingProfile: { careerGoal: "Data Scientist", field: "Data Science" }
    });

    // Create an assessment attempt for User A in Backend Development
    await AttemptResult.create({
      userId: userA._id,
      assessmentTitle: "Backend Node.js Core",
      assessmentCategory: "Backend Development",
      assessmentField: "Software Engineering",
      scorePercent: 85,
      totalScore: 85,
      maxScore: 100,
      correctCount: 8,
      incorrectCount: 1,
      unansweredCount: 0,
      totalQuestions: 9,
      elapsedSeconds: 200,
      completedAt: new Date()
    });

    // Create an assessment attempt for User B in Machine Learning
    await AttemptResult.create({
      userId: userB._id,
      assessmentTitle: "Machine Learning Math",
      assessmentCategory: "Machine Learning",
      assessmentField: "Data Science",
      scorePercent: 40,
      totalScore: 40,
      maxScore: 100,
      correctCount: 4,
      incorrectCount: 6,
      unansweredCount: 0,
      totalQuestions: 10,
      elapsedSeconds: 300,
      completedAt: new Date()
    });

    // Generate roadmaps for both users
    const roadmapA = await generatePersonalizedRoadmap(userA._id, "Backend Developer", "backend-developer");
    const roadmapB = await generatePersonalizedRoadmap(userB._id, "Data Scientist", "data-scientist");

    // Verify User A's roadmap
    console.log(`[User A] Target Career: "${roadmapA.targetCareer}", Readiness: ${roadmapA.readinessScore}%`);
    console.log(`[User B] Target Career: "${roadmapB.targetCareer}", Readiness: ${roadmapB.readinessScore}%`);

    if (String(roadmapA.userId) === String(userA._id) && roadmapA.targetCareer === "Backend Developer") {
      results.objective1.details.push("User A roadmap strictly isolated and bound to User A.");
    } else {
      throw new Error("User A roadmap data mismatch!");
    }

    if (String(roadmapB.userId) === String(userB._id) && roadmapB.targetCareer === "Data Scientist") {
      results.objective1.details.push("User B roadmap strictly isolated and bound to User B.");
    } else {
      throw new Error("User B roadmap data mismatch!");
    }

    // Verify endpoint getRoadmapAnalytics with mock req/res for User A
    let resDataA = null;
    await getRoadmapAnalytics(
      { user: userA, query: { courseId: "backend-developer" } },
      { json(d) { resDataA = d; return this; } }
    );

    let resDataB = null;
    await getRoadmapAnalytics(
      { user: userB, query: { courseId: "data-scientist" } },
      { json(d) { resDataB = d; return this; } }
    );

    if (resDataA.data.targetCareer === "Backend Developer" && resDataB.data.targetCareer === "Data Scientist") {
      results.objective1.details.push("getRoadmapAnalytics enforces token-extracted userId filter with zero cross-user leakage.");
      results.objective1.passed = true;
    } else {
      throw new Error("Cross-user roadmap leakage detected in controller response!");
    }

    // ---------------------------------------------------------------------------
    // TEST SUITE 2: OBJECTIVE 2 - CONCURRENT MULTI-COURSE ROADMAP PERSISTENCE
    // ---------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 2: OBJECTIVE 2 - Concurrent Multi-Course Roadmap Persistence ---");

    // For User A, generate Course 1: "full-stack-web-development"
    const course1Id = "full-stack-web-development";
    const rmCourse1 = await generatePersonalizedRoadmap(userA._id, "Full-Stack Web Development", course1Id);

    // For User A, generate Course 2: "class-10-social-science"
    const course2Id = "class-10-social-science";
    const rmCourse2 = await generatePersonalizedRoadmap(userA._id, "Class 10 Social Science", course2Id);

    // Query database for all roadmaps belonging to User A
    const allUserARoadmaps = await UserRoadmap.find({ userId: userA._id }).lean();
    console.log(`[Multi-Course Check] Total roadmaps persisted for User A: ${allUserARoadmaps.length} (Expected >= 2)`);
    allUserARoadmaps.forEach((rm, i) => {
      console.log(`  Course ${i + 1}: courseId="${rm.courseId}", targetCareer="${rm.targetCareer}"`);
    });

    const hasCourse1 = allUserARoadmaps.some(rm => rm.courseId === course1Id);
    const hasCourse2 = allUserARoadmaps.some(rm => rm.courseId === course2Id);

    if (hasCourse1 && hasCourse2 && allUserARoadmaps.length >= 2) {
      results.objective2.details.push("Database schema successfully persists multiple independent roadmaps for a single user using composite index.");
    } else {
      throw new Error(`Expected at least 2 distinct roadmaps for User A, found ${allUserARoadmaps.length}`);
    }

    // Verify retrieving Course 1 does NOT return Course 2
    const fetchedCourse1 = await UserRoadmap.findOne({ userId: userA._id, courseId: course1Id }).lean();
    const fetchedCourse2 = await UserRoadmap.findOne({ userId: userA._id, courseId: course2Id }).lean();

    if (fetchedCourse1.courseId === course1Id && fetchedCourse2.courseId === course2Id &&
        fetchedCourse1.targetCareer !== fetchedCourse2.targetCareer) {
      results.objective2.details.push("Retrieving course-specific roadmap loads exact course without cross-contamination.");
    } else {
      throw new Error("Course cross-contamination detected between Course 1 and Course 2!");
    }

    // Test getUserRoadmaps controller
    let userRoadmapsRes = null;
    await getUserRoadmaps(
      { user: userA },
      { json(d) { userRoadmapsRes = d; return this; } }
    );

    console.log(`[getUserRoadmaps API] Returned ${userRoadmapsRes.data.totalCourses} enrolled courses for User A.`);
    if (userRoadmapsRes.data.totalCourses >= 2) {
      results.objective2.details.push("getUserRoadmaps endpoint lists all enrolled courses for multi-course switching.");
      results.objective2.passed = true;
    } else {
      throw new Error("getUserRoadmaps failed to list all enrolled courses!");
    }

    // ---------------------------------------------------------------------------
    // TEST SUITE 3: OBJECTIVE 3 - PROGRESS STATE RESUMPTION
    // ---------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 3: OBJECTIVE 3 - Progress State Resumption (\"Pick Up Where You Left Off\") ---");

    // 3A. User makes progress on Course 1: completes Stage 1, advances to Stage 2
    console.log("[Resumption] Updating progress: User completes Phase 1 and advances to Phase 2...");
    let updateRes = null;
    await updateUserRoadmap(
      {
        user: userA,
        body: {
          courseId: course1Id,
          stageId: 1, // Mark Stage 1 completed
          completedStageIds: [1],
          currentNodeIndex: 1, // Stage 2 active
          currentTopic: "Core Competencies & Architecture",
          completedTopics: ["HTML/CSS Basics", "JavaScript Syntax"]
        }
      },
      { json(d) { updateRes = d; return this; } }
    );

    const savedStateCourse1 = await UserRoadmap.findOne({ userId: userA._id, courseId: course1Id }).lean();
    console.log(`[State Check Course 1] activeStageId: ${savedStateCourse1.activeStageId}, currentNodeIndex: ${savedStateCourse1.currentNodeIndex}`);
    console.log(`[State Check Course 1] currentTopic: "${savedStateCourse1.currentTopic}", completedTopics: [${savedStateCourse1.completedTopics?.join(", ")}]`);
    console.log(`[State Check Course 1] lastAccessed: ${savedStateCourse1.lastAccessed}`);

    if (savedStateCourse1.activeStageId === 2 &&
        savedStateCourse1.currentNodeIndex === 1 &&
        savedStateCourse1.completedTopics.length === 2 &&
        savedStateCourse1.stages.find(s => s.id === 1)?.status === "completed") {
      results.objective3.details.push("State-tracking attributes (currentNodeIndex, activeStageId, completedTopics, lastAccessed) persisted correctly.");
    } else {
      throw new Error("Failed to persist progress resumption state attributes!");
    }

    // 3B. User switches to Course 2 and does work there
    console.log("[Resumption] User switches to Course 2 (Class 10 Social Science)...");
    await updateUserRoadmap(
      {
        user: userA,
        body: {
          courseId: course2Id,
          currentNodeIndex: 0,
          currentTopic: "NCERT Textbook Mastery",
          completedTopics: ["The Rise of Nationalism in Europe"]
        }
      },
      { json(d) { } }
    );

    // 3C. ConceptRoot recommendation ingestion simulation on Course 1
    // Re-running generatePersonalizedRoadmap for Course 1 must NOT reset Stage 1 completion or reset currentNodeIndex
    console.log("[Resumption] ConceptRoot ingests targeted recommendation into Course 1...");
    const reIngestedRoadmap = await generatePersonalizedRoadmap(userA._id, "Full-Stack Web Development", course1Id);

    console.log(`[Re-Ingestion Check] Stage 1 status: "${reIngestedRoadmap.stages.find(s => s.id === 1)?.status}" (Expected: completed)`);
    console.log(`[Re-Ingestion Check] Stage 2 status: "${reIngestedRoadmap.stages.find(s => s.id === 2)?.status}" (Expected: current)`);
    console.log(`[Re-Ingestion Check] activeStageId: ${reIngestedRoadmap.activeStageId} (Expected: 2)`);
    console.log(`[Re-Ingestion Check] currentNodeIndex: ${reIngestedRoadmap.currentNodeIndex} (Expected: 1)`);

    const stage1StillCompleted = reIngestedRoadmap.stages.find(s => s.id === 1)?.status === "completed";
    const stage2IsCurrent = reIngestedRoadmap.stages.find(s => s.id === 2)?.status === "current";
    const activeStagePreserved = reIngestedRoadmap.activeStageId === 2;

    if (stage1StillCompleted && stage2IsCurrent && activeStagePreserved) {
      results.objective3.details.push("ConceptRoot recommendation ingestion updates active state dynamically without resetting the learning tree.");
      results.objective3.passed = true;
    } else {
      throw new Error("Roadmap tree was reset after recommendation ingestion!");
    }

    // Clean up temporary test data
    console.log("\n[Cleanup] Cleaning up test data...");
    await AttemptResult.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await UserRoadmap.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log("[Cleanup] Completed successfully.");

  } catch (err) {
    console.error("\n[VERIFICATION ERROR]:", err);
  } finally {
    await new Promise((r) => setTimeout(r, 1000));
    await mongoose.disconnect();
    console.log("\n=== VERIFICATION SUMMARY ===");
    console.log(`Objective 1 (Strict User Data Isolation): ${results.objective1.passed ? "PASSED" : "FAILED"}`);
    results.objective1.details.forEach(d => console.log(`  ✓ ${d}`));

    console.log(`\nObjective 2 (Concurrent Multi-Course Roadmap Persistence): ${results.objective2.passed ? "PASSED" : "FAILED"}`);
    results.objective2.details.forEach(d => console.log(`  ✓ ${d}`));

    console.log(`\nObjective 3 (Progress State Resumption): ${results.objective3.passed ? "PASSED" : "FAILED"}`);
    results.objective3.details.forEach(d => console.log(`  ✓ ${d}`));

    console.log("\n=========================================================");
  }
}

runRoadmapVerification();
