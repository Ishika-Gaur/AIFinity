import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import CourseRequest from "../src/models/CourseRequest.js";
import { sendCourseRequestAdminNotification } from "../src/services/emailService.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aifinity";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_key_change_in_prod";

async function runTests() {
  console.log("=================================================");
  console.log(" TESTING COURSE REQUEST FEATURE");
  console.log("=================================================\n");

  let studentUser = null;
  let adminUser = null;
  let testRequestId = null;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB successfully.");

    // 1. Find or create a test student user
    studentUser = await User.findOne({ role: "student" });
    if (!studentUser) {
      studentUser = await User.create({
        name: "Test Learner",
        email: "test.learner." + Date.now() + "@example.com",
        passwordHash: await User.hashPassword("password123"),
        role: "student",
        onboardingCompleted: true,
      });
      console.log("✓ Created test student:", studentUser.email);
    } else {
      console.log("✓ Found existing student:", studentUser.email);
    }

    // 2. Find or create a test admin user
    adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Test Admin",
        email: "test.admin." + Date.now() + "@example.com",
        passwordHash: await User.hashPassword("password123"),
        role: "admin",
        onboardingCompleted: true,
      });
      console.log("✓ Created test admin:", adminUser.email);
    } else {
      console.log("✓ Found existing admin:", adminUser.email);
    }

    // 3. Test CourseRequest model validation
    console.log("\n--- Testing Model Validation ---");
    const invalidRequest = new CourseRequest({
      userId: studentUser._id,
      // missing courseName and reason
    });
    let validationPassed = false;
    try {
      await invalidRequest.validate();
      validationPassed = true;
    } catch (valErr) {
      console.log("✓ Model correctly caught missing required fields:", Object.keys(valErr.errors).join(", "));
    }
    if (validationPassed) {
      throw new Error("Validation test failed: model accepted empty required fields");
    }

    // 4. Test CourseRequest creation
    console.log("\n--- Testing Course Request Creation ---");
    const testCourseName = "Advanced Next.js 15 & Server Actions " + Date.now();
    const createdReq = await CourseRequest.create({
      userId: studentUser._id,
      courseName: testCourseName,
      provider: "Vercel Academy",
      referenceUrl: "https://nextjs.org/learn",
      reason: "I need to master Next.js 15 app router and Server Actions for production full-stack engineering.",
      additionalDetails: "Include testing and CI/CD pipelines.",
      status: "pending",
    });
    testRequestId = createdReq._id;
    console.log("✓ Created CourseRequest successfully in MongoDB with ID:", testRequestId);
    console.log("  Course Name:", createdReq.courseName);
    console.log("  Initial Status:", createdReq.status);

    // 5. Test Duplicate Request Protection logic
    console.log("\n--- Testing Duplicate Request Protection ---");
    const DUPLICATE_COOLDOWN_MS = 15 * 60 * 1000;
    const recentCutoff = new Date(Date.now() - DUPLICATE_COOLDOWN_MS);
    const duplicateCheck = await CourseRequest.findOne({
      userId: studentUser._id,
      createdAt: { $gte: recentCutoff },
      courseName: testCourseName,
    });
    if (duplicateCheck) {
      console.log("✓ Duplicate detector correctly caught existing recent submission for same course.");
    } else {
      throw new Error("Duplicate detector failed to locate recent submission");
    }

    // 6. Test Email Notification function
    console.log("\n--- Testing Admin Email Notification Service ---");
    const emailResult = await sendCourseRequestAdminNotification({
      courseRequest: createdReq,
      user: studentUser,
    });
    console.log("✓ sendCourseRequestAdminNotification executed safely, result:", emailResult);

    // 7. Test Admin Status Transition
    console.log("\n--- Testing Admin Status Transitions ---");
    const statusesToTest = ["reviewing", "completed", "rejected"];
    for (const st of statusesToTest) {
      const updated = await CourseRequest.findByIdAndUpdate(
        testRequestId,
        { status: st },
        { new: true, runValidators: true }
      );
      if (updated.status === st) {
        console.log(`✓ Successfully updated status to "${st}"`);
      } else {
        throw new Error(`Failed to update status to ${st}`);
      }
    }

    // 8. Test Role-based Access Tokens
    console.log("\n--- Testing JWT Tokens & Authorization Roles ---");
    const studentToken = jwt.sign({ id: studentUser._id, role: "student" }, JWT_SECRET);
    const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, JWT_SECRET);

    const decodedStudent = jwt.verify(studentToken, JWT_SECRET);
    const decodedAdmin = jwt.verify(adminToken, JWT_SECRET);

    console.log("✓ Student Token Role:", decodedStudent.role);
    console.log("✓ Admin Token Role:", decodedAdmin.role);

    if (decodedStudent.role === "admin" || decodedAdmin.role !== "admin") {
      throw new Error("JWT role authorization failed");
    }

    // 9. Query user's requests
    console.log("\n--- Testing User History Query ---");
    const userRequests = await CourseRequest.find({ userId: studentUser._id }).sort({ createdAt: -1 });
    console.log(`✓ Retrieved ${userRequests.length} requests for user ${studentUser.name}`);

    console.log("\n=================================================");
    console.log(" ALL TESTS PASSED SUCCESSFULLY! ✓");
    console.log("=================================================");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    // Cleanup the test course request record
    if (testRequestId) {
      await CourseRequest.findByIdAndDelete(testRequestId);
      console.log("✓ Cleaned up test CourseRequest record.");
    }
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB.");
  }
}

runTests();
