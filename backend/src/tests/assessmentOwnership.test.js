import { jest, describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import app from "../server.js";
import User from "../models/User.js";
import Assessment from "../models/Assessment.js";
import AttemptResult from "../models/AttemptResult.js";

process.env.NODE_ENV = "test";
dotenv.config();

// Optionally load .env.test if present
const envTestPath = path.resolve(process.cwd(), ".env.test");
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
}

function extractDbName(uri) {
  if (!uri || typeof uri !== "string") return "";
  try {
    const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const slashIndex = withoutProtocol.indexOf("/");
    if (slashIndex === -1) return "";
    const pathAndQuery = withoutProtocol.slice(slashIndex + 1);
    const dbName = pathAndQuery.split("?")[0].trim();
    return dbName;
  } catch {
    return "";
  }
}

function resolveAndValidateTestMongoUri() {
  const explicitTestUri =
    process.env.TEST_MONGODB_URI ||
    process.env.MONGODB_TEST_URI ||
    process.env.MONGODB_URI_TEST;

  const localTestUri =
    process.env.LOCAL_TEST_MONGODB_URI ||
    (process.env.USE_LOCAL_TEST_DB === "true" ? "mongodb://127.0.0.1:27017/aifinity_test" : null);

  const candidateUri = explicitTestUri || localTestUri;

  if (!candidateUri) {
    throw new Error(
      "[SAFETY GUARD] Dedicated test database configuration is missing.\n" +
      "To prevent accidental modification of shared development or production data, " +
      "tests must be executed with an explicit test database URI.\n" +
      "Please set TEST_MONGODB_URI (e.g., 'mongodb+srv://.../aifinity_test') " +
      "or set USE_LOCAL_TEST_DB=true with an active local MongoDB instance."
    );
  }

  const dbName = extractDbName(candidateUri);

  // Must not be the shared development or production database
  const disallowedNames = ["aifinity", "production", "development", "admin", "config", "local"];
  if (!dbName || disallowedNames.includes(dbName.toLowerCase()) || !dbName.toLowerCase().includes("test")) {
    throw new Error(
      `[SAFETY GUARD] Refusing to connect: Selected database '${dbName || "unknown"}' is not a designated test database.\n` +
      "The database name must explicitly contain 'test' (e.g., 'aifinity_test') and cannot be a shared development/production database."
    );
  }

  return { uri: candidateUri, dbName };
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_key_change_in_prod";

jest.setTimeout(35000);

describe("Assessment Ownership & Result Integrity Tests", () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  let privateAssessment;
  let publicAssessment;
  let dupAssessment1;
  let dupAssessment2;
  let uncompletedAssessment;

  beforeAll(async () => {
    const { uri: testMongoUri, dbName: testDbName } = resolveAndValidateTestMongoUri();

    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(testMongoUri);
      } catch (err) {
        const sanitizedErr = (err.message || "").replace(/:\/\/([^:@]+):([^@]+)@/, "://***:***@");
        throw new Error(`[Test Suite] Failed to connect to test database (${testDbName}): ${sanitizedErr}`);
      }
    }

    // Safety verification: verify mongoose is actually connected to the test database
    if (mongoose.connection.name !== testDbName) {
      await mongoose.disconnect();
      throw new Error(
        `[SAFETY GUARD] Connected database name '${mongoose.connection.name}' does not match expected test database '${testDbName}'. Aborting.`
      );
    }

    console.log(`[Test Suite] Safely connected to isolated test database: ${testDbName}`);

    // Ensure database indexes (including unique sparse index on attemptId) are built
    await AttemptResult.init();

    const timestamp = Date.now();

    // Create User A
    userA = await User.create({
      name: "Integrity Test User A",
      email: `test_integrity_a_${timestamp}@example.com`,
      role: "student",
      passwordHash: "hash_test_a",
      selectedField: "Software Development",
      onboardingCompleted: true,
    });
    tokenA = jwt.sign({ id: userA._id }, JWT_SECRET);

    // Create User B
    userB = await User.create({
      name: "Integrity Test User B",
      email: `test_integrity_b_${timestamp}@example.com`,
      role: "student",
      passwordHash: "hash_test_b",
      selectedField: "Data Science & Analytics",
      onboardingCompleted: true,
    });
    tokenB = jwt.sign({ id: userB._id }, JWT_SECRET);

    // Create Private AI Assessment owned by User A
    privateAssessment = await Assessment.create({
      title: "User A Node.js Mastery",
      description: "Private AI assessment for User A",
      field: "Software Development",
      category: "Node.js",
      difficulty: "Medium",
      duration: 10,
      status: "published",
      isAiGenerated: true,
      userId: userA._id,
      createdBy: userA._id,
      questions: [
        {
          type: "mcq",
          difficulty: "Medium",
          topic: "Node.js",
          concept: "Event Loop",
          question: "Which phase of the event loop executes setTimeout callbacks?",
          options: ["Timers", "Poll", "Check", "Close"],
          answer: "Timers",
        },
      ],
    });

    // Create Public published non-AI assessment
    publicAssessment = await Assessment.create({
      title: "Public General Coding Assessment",
      description: "Public assessment open to all users",
      field: "Software Development",
      category: "General Coding",
      difficulty: "Easy",
      duration: 10,
      status: "published",
      isAiGenerated: false,
      createdBy: userA._id,
      questions: [
        {
          type: "mcq",
          difficulty: "Easy",
          topic: "General",
          concept: "Variables",
          question: "Which keyword declares a block-scoped variable in JS?",
          options: ["let", "var", "function", "define"],
          answer: "let",
        },
      ],
    });

    // Create Duplicate Title Assessment 1
    dupAssessment1 = await Assessment.create({
      title: "Duplicate Title Benchmark",
      description: "Assessment 1 with identical title",
      field: "Software Development",
      category: "Frontend",
      difficulty: "Easy",
      duration: 10,
      status: "published",
      isAiGenerated: false,
      createdBy: userA._id,
      questions: [
        {
          type: "mcq",
          difficulty: "Easy",
          topic: "Frontend",
          concept: "HTML",
          question: "What does HTML stand for?",
          options: ["Hyper Text Markup Language", "Home Tool Markup Language"],
          answer: "Hyper Text Markup Language",
        },
      ],
    });

    // Create Duplicate Title Assessment 2
    dupAssessment2 = await Assessment.create({
      title: "Duplicate Title Benchmark",
      description: "Assessment 2 with identical title",
      field: "Software Development",
      category: "Frontend",
      difficulty: "Easy",
      duration: 10,
      status: "published",
      isAiGenerated: false,
      createdBy: userA._id,
      questions: [
        {
          type: "mcq",
          difficulty: "Easy",
          topic: "Frontend",
          concept: "CSS",
          question: "What does CSS stand for?",
          options: ["Cascading Style Sheets", "Creative Style System"],
          answer: "Cascading Style Sheets",
        },
      ],
    });

    // Create Uncompleted Assessment
    uncompletedAssessment = await Assessment.create({
      title: "Uncompleted Assessment Benchmark",
      description: "Assessment with zero attempts",
      field: "Software Development",
      category: "Backend",
      difficulty: "Easy",
      duration: 10,
      status: "published",
      isAiGenerated: false,
      createdBy: userA._id,
      questions: [
        {
          type: "mcq",
          difficulty: "Easy",
          topic: "Backend",
          concept: "REST",
          question: "What does REST stand for?",
          options: ["Representational State Transfer", "Remote Execution System"],
          answer: "Representational State Transfer",
        },
      ],
    });
  }, 35000);

  afterAll(async () => {
    // Clean up only our created test data
    if (userA?._id) {
      await AttemptResult.deleteMany({ userId: userA._id });
      await Assessment.deleteMany({ createdBy: userA._id });
      await User.findByIdAndDelete(userA._id);
    }
    if (userB?._id) {
      await AttemptResult.deleteMany({ userId: userB._id });
      await User.findByIdAndDelete(userB._id);
    }
    if (privateAssessment?._id) {
      await Assessment.findByIdAndDelete(privateAssessment._id);
    }
    if (publicAssessment?._id) {
      await Assessment.findByIdAndDelete(publicAssessment._id);
    }
    if (dupAssessment1?._id) {
      await Assessment.findByIdAndDelete(dupAssessment1._id);
    }
    if (dupAssessment2?._id) {
      await Assessment.findByIdAndDelete(dupAssessment2._id);
    }
    if (uncompletedAssessment?._id) {
      await Assessment.findByIdAndDelete(uncompletedAssessment._id);
    }

    await mongoose.disconnect();
  }, 35000);

  describe("1. Access Control on Private AI Assessments", () => {
    test("User A can start their own private AI-generated assessment", async () => {
      const res = await request(app)
        .get(`/api/assessments/${privateAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.attemptId).toBeDefined();
      expect(res.body.assessment).toBeDefined();
      expect(res.body.assessment.title).toBe(privateAssessment.title);
    });

    test("User B cannot start User A's private AI-generated assessment (403)", async () => {
      const res = await request(app)
        .get(`/api/assessments/${privateAssessment._id}/start`)
        .set("Cookie", [`token=${tokenB}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission|authorized/i);
    });

    test("User B cannot submit answers to User A's private AI-generated assessment (403)", async () => {
      const res = await request(app)
        .post(`/api/assessments/${privateAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenB}`])
        .send({
          attemptId: "att_fake_id",
          responses: {},
          elapsedSeconds: 30,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. Attempt Session Ownership Binding & Assessment Binding", () => {
    test("An attempt session cannot be submitted by a different user (403)", async () => {
      // User A starts public assessment
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(startRes.status).toBe(200);
      const attemptIdA = startRes.body.attemptId;

      // User B attempts to submit with User A's attemptId
      const submitRes = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenB}`])
        .send({
          attemptId: attemptIdA,
          responses: {},
          elapsedSeconds: 30,
        });

      expect(submitRes.status).toBe(403);
      expect(submitRes.body.success).toBe(false);

      // Verify no AttemptResult was created for User B
      const resultB = await AttemptResult.findOne({ userId: userB._id });
      expect(resultB).toBeNull();
    });

    test("Submitting an attempt session to a different assessment is rejected (400) via submitAttempt", async () => {
      // User A starts publicAssessment
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;

      // User A tries to submit publicAssessment's attemptId to privateAssessment
      const res = await request(app)
        .post(`/api/assessments/${privateAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: {},
          elapsedSeconds: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/match.*assessment/i);
    });

    test("Submitting an attempt session to a different assessment is rejected (400) via evaluateAttemptWithAI", async () => {
      // User A starts publicAssessment
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;

      // User A tries to evaluate publicAssessment's attemptId on privateAssessment
      const res = await request(app)
        .post(`/api/assessments/${privateAssessment._id}/evaluate-ai`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: {},
          elapsedSeconds: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/match.*assessment/i);
    });

    test("Submitting with missing or invalid attempt session is rejected (400)", async () => {
      const res = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId: "att_nonexistent_session_123",
          responses: {},
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. Unauthenticated Access Protection", () => {
    test("Unauthenticated request to start an assessment is rejected (401)", async () => {
      const res = await request(app).get(`/api/assessments/${publicAssessment._id}/start`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("Unauthenticated request to submit an assessment is rejected (401)", async () => {
      const res = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .send({ attemptId: "att_123" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("Unauthenticated request to /daily-status is rejected (401)", async () => {
      const res = await request(app).get("/api/assessments/daily-status");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("Authenticated request to /daily-status succeeds (200)", async () => {
      const res = await request(app)
        .get("/api/assessments/daily-status")
        .set("Cookie", [`token=${tokenA}`]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.completedDates)).toBe(true);
    });
  });

  describe("4. Nonexistent Assessment ID Handling", () => {
    test("Nonexistent assessment ID returns 404 without creating a new benchmark assessment", async () => {
      const nonexistentId = new mongoose.Types.ObjectId();
      const countBefore = await Assessment.countDocuments({ createdBy: userA._id });

      const res = await request(app)
        .get(`/api/assessments/${nonexistentId}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const countAfter = await Assessment.countDocuments({ createdBy: userA._id });
      expect(countAfter).toBe(countBefore);
    });
  });

  describe("5. Public Published Assessments Accessibility", () => {
    test("Both User A and User B can access a published non-AI assessment", async () => {
      const resA = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);
      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);

      const resB = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenB}`]);
      expect(resB.status).toBe(200);
      expect(resB.body.success).toBe(true);
    });
  });

  describe("6. Submission Idempotency & Concurrent Duplicate Prevention", () => {
    test("Repeated submission returns the same result without creating duplicate records", async () => {
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);
      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;
      const questionId = startRes.body.assessment.questions[0].id;

      // First submission
      const subRes1 = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: { [questionId]: "let" },
          elapsedSeconds: 20,
        });

      expect(subRes1.status).toBe(200);
      expect(subRes1.body.success).toBe(true);
      expect(subRes1.body.resultId).toBeDefined();

      const countAfterFirst = await AttemptResult.countDocuments({ attemptId });
      expect(countAfterFirst).toBe(1);

      // Second submission with the exact same attemptId
      const subRes2 = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: { [questionId]: "let" },
          elapsedSeconds: 20,
        });

      // Assert second submission response matches first submission
      expect(subRes2.status).toBe(200);
      expect(subRes2.body.success).toBe(true);
      expect(String(subRes2.body.resultId)).toBe(String(subRes1.body.resultId));
      expect(subRes2.body.scorePercent).toBe(subRes1.body.scorePercent);

      // Assert count in MongoDB did not duplicate
      const countAfterSecond = await AttemptResult.countDocuments({ attemptId });
      expect(countAfterSecond).toBe(1);
    });

    test("Concurrent submissions for the same attempt persist exactly one AttemptResult record", async () => {
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);
      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;
      const questionId = startRes.body.assessment.questions[0].id;

      // Fire 3 simultaneous concurrent submissions
      const promises = [1, 2, 3].map(() =>
        request(app)
          .post(`/api/assessments/${publicAssessment._id}/submit`)
          .set("Cookie", [`token=${tokenA}`])
          .send({
            attemptId,
            responses: { [questionId]: "let" },
            elapsedSeconds: 25,
          })
      );

      const results = await Promise.all(promises);

      // All concurrent requests should succeed
      for (const res of results) {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.resultId).toBeDefined();
      }

      // All responses must return the exact same resultId
      const firstResultId = String(results[0].body.resultId);
      for (const res of results) {
        expect(String(res.body.resultId)).toBe(firstResultId);
      }

      // Exactly ONE document persisted in MongoDB
      const persistedCount = await AttemptResult.countDocuments({ attemptId });
      expect(persistedCount).toBe(1);
    });

    test("Two concurrent submissions with different answers persist exactly one record and both responses match the persisted result", async () => {
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);
      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;
      const questionId = startRes.body.assessment.questions[0].id;

      // Submission 1: answers "let" (correct, score 100)
      const sub1 = request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: { [questionId]: "let" },
          elapsedSeconds: 20,
        });

      // Submission 2: answers "var" (incorrect, score 0)
      const sub2 = request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: { [questionId]: "var" },
          elapsedSeconds: 22,
        });

      const [res1, res2] = await Promise.all([sub1, sub2]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res2.body.success).toBe(true);

      // Verify exactly ONE database record exists
      const persistedCount = await AttemptResult.countDocuments({ attemptId });
      expect(persistedCount).toBe(1);

      const persistedRecord = await AttemptResult.findOne({ attemptId }).lean();
      expect(persistedRecord).toBeDefined();

      // Verify that both responses represent the same persisted record
      expect(String(res1.body.resultId)).toBe(String(persistedRecord._id));
      expect(String(res2.body.resultId)).toBe(String(persistedRecord._id));

      expect(res1.body.scorePercent).toBe(persistedRecord.scorePercent);
      expect(res2.body.scorePercent).toBe(persistedRecord.scorePercent);

      // Crucial: verify that the losing response does NOT return its own unpersisted answers or score
      expect(res1.body.questionResults[0].userAnswer).toBe(persistedRecord.questionResults[0].userAnswer);
      expect(res2.body.questionResults[0].userAnswer).toBe(persistedRecord.questionResults[0].userAnswer);
    });

    test("Non-duplicate persistence failure returns 500 error instead of silently returning 200", async () => {
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);
      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;
      const questionId = startRes.body.assessment.questions[0].id;

      jest.spyOn(AttemptResult, "create").mockRejectedValueOnce(new Error("Database connection lost"));

      const res = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: { [questionId]: "let" },
          elapsedSeconds: 20,
        });

      jest.restoreAllMocks();

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/failed to persist/i);

      // Verify no record was saved in DB
      const record = await AttemptResult.findOne({ attemptId });
      expect(record).toBeNull();
    });

    test("When duplicate-key race occurs but findOne fails, return 500 server error", async () => {
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);
      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;
      const questionId = startRes.body.assessment.questions[0].id;

      const dupError = new Error("E11000 duplicate key");
      dupError.code = 11000;

      jest.spyOn(AttemptResult, "create").mockRejectedValueOnce(dupError);
      jest.spyOn(AttemptResult, "findOne").mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });

      const res = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: { [questionId]: "let" },
          elapsedSeconds: 20,
        });

      jest.restoreAllMocks();

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe("7. Result Retrieval After Refresh & User Scoping", () => {
    test("User A can retrieve their latest completed result for an assessment", async () => {
      const res = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/result/latest`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toBeDefined();
      expect(String(res.body.result.userId)).toBe(String(userA._id));
      expect(String(res.body.result.assessmentId)).toBe(String(publicAssessment._id));
    });

    test("Result retrieval avoids ambiguous title matching across assessments with identical titles", async () => {
      // User A completes dupAssessment1
      const startRes = await request(app)
        .get(`/api/assessments/${dupAssessment1._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);
      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;
      const qId = startRes.body.assessment.questions[0].id;

      const subRes = await request(app)
        .post(`/api/assessments/${dupAssessment1._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: { [qId]: "Hyper Text Markup Language" },
          elapsedSeconds: 12,
        });
      expect(subRes.status).toBe(200);

      // User A queries dupAssessment2 which has the SAME title ("Duplicate Title Benchmark") but different ID
      const queryDup2 = await request(app)
        .get(`/api/assessments/${dupAssessment2._id}/result/latest`)
        .set("Cookie", [`token=${tokenA}`]);

      // MUST return 404 because userA has never completed dupAssessment2
      expect(queryDup2.status).toBe(404);
      expect(queryDup2.body.success).toBe(false);

      // Querying dupAssessment1 returns the correct result
      const queryDup1 = await request(app)
        .get(`/api/assessments/${dupAssessment1._id}/result/latest`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(queryDup1.status).toBe(200);
      expect(String(queryDup1.body.result.assessmentId)).toBe(String(dupAssessment1._id));
    });

    test("Querying result for another user's private assessment returns 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/assessments/${privateAssessment._id}/result/latest`)
        .set("Cookie", [`token=${tokenB}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission/i);
    });

    test("User with no completed result receives 404 Not Found", async () => {
      const res = await request(app)
        .get(`/api/assessments/${uncompletedAssessment._id}/result/latest`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no completed result found/i);
    });

    test("User B querying result for publicAssessment returns 404 (does not leak User A's result)", async () => {
      const res = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/result/latest`)
        .set("Cookie", [`token=${tokenB}`]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test("Dashboard results remain strictly scoped to authenticated user", async () => {
      const dashResB = await request(app)
        .get("/api/dashboard")
        .set("Cookie", [`token=${tokenB}`]);

      expect(dashResB.status).toBe(200);
      expect(dashResB.body.data.stats.assessments.value).toBe(0);
      expect(dashResB.body.data.analytics.assessments.history.length).toBe(0);
    });
  });

  describe("8. Question Shuffling, Scoring, and Retake Behavior", () => {
    test("Assessment questions are delivered with shuffled options and answer is stripped", async () => {
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(startRes.status).toBe(200);
      const q = startRes.body.assessment.questions[0];
      expect(q).toBeDefined();
      expect(q.options).toBeDefined();
      expect(Array.isArray(q.options)).toBe(true);
      // Correct answer must not be leaked to the client in question object
      expect(q.answer).toBeUndefined();
    });

    test("Scoring correctly reflects correct and unanswered questions", async () => {
      const startRes = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(startRes.status).toBe(200);
      const attemptId = startRes.body.attemptId;

      // Submit with empty responses (unanswered)
      const submitRes = await request(app)
        .post(`/api/assessments/${publicAssessment._id}/submit`)
        .set("Cookie", [`token=${tokenA}`])
        .send({
          attemptId,
          responses: {},
          elapsedSeconds: 10,
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.scorePercent).toBe(0);
      expect(submitRes.body.unansweredCount).toBe(1);
      expect(submitRes.body.correctCount).toBe(0);
    });

    test("Retake flow: Starting a new attempt creates a new independent session and attemptId", async () => {
      const start1 = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      const start2 = await request(app)
        .get(`/api/assessments/${publicAssessment._id}/start`)
        .set("Cookie", [`token=${tokenA}`]);

      expect(start1.status).toBe(200);
      expect(start2.status).toBe(200);
      expect(start1.body.attemptId).not.toBe(start2.body.attemptId);
    });
  });
});
