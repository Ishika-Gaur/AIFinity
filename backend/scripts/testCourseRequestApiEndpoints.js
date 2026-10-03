import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { startServer } from "../src/server.js";
import User from "../src/models/User.js";
import CourseRequest from "../src/models/CourseRequest.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_key_change_in_prod";

async function runApiTests() {
  console.log("=================================================");
  console.log(" TESTING COURSE REQUEST HTTP API ENDPOINTS");
  console.log("=================================================\n");

  let server = null;
  let testStudent = null;
  let testAdmin = null;
  let createdRequestId = null;

  try {
    const port = process.env.PORT || 5000;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`✓ Testing server at ${baseUrl}`);
    // Wait briefly for server listening and DB connection
    await new Promise((r) => setTimeout(r, 2000));

    // Retrieve test student & admin
    testStudent = await User.findOne({ role: "student" });
    testAdmin = await User.findOne({ role: "admin" });

    if (!testStudent || !testAdmin) {
      throw new Error("Student or Admin user missing in MongoDB");
    }

    const studentToken = jwt.sign({ id: testStudent._id, role: "student" }, JWT_SECRET);
    const adminToken = jwt.sign({ id: testAdmin._id, role: "admin" }, JWT_SECRET);

    // 1. Unauthenticated submission
    console.log("\n1. Testing unauthenticated POST /api/course-requests...");
    const unauthRes = await fetch(`${baseUrl}/api/course-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseName: "Test Course", reason: "Want to learn" }),
    });
    console.log("  Status:", unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log("✓ Correctly rejected unauthenticated request with 401.");

    // 2. Authenticated student submission
    console.log("\n2. Testing authenticated student POST /api/course-requests...");
    const uniqueCourseName = "Distributed Systems in Rust " + Date.now();
    const studentRes = await fetch(`${baseUrl}/api/course-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${studentToken}`,
      },
      body: JSON.stringify({
        courseName: uniqueCourseName,
        provider: "MIT OpenCourseWare",
        referenceUrl: "https://ocw.mit.edu",
        reason: "Need deep knowledge of consensus protocols and Raft algorithms.",
        additionalDetails: "Include hands-on coding labs.",
      }),
    });
    const studentData = await studentRes.json();
    console.log("  Status:", studentRes.status);
    console.log("  Response message:", studentData.message);
    if (studentRes.status !== 201 || !studentData.success) {
      throw new Error(`Expected 201 Created, got ${studentRes.status}: ${JSON.stringify(studentData)}`);
    }
    createdRequestId = studentData.request.id;
    console.log("✓ Correctly created course request. ID:", createdRequestId);
    console.log("  User attached:", studentData.request.userName, `(${studentData.request.userEmail})`);

    // 3. Duplicate submission check
    console.log("\n3. Testing duplicate course request submission...");
    const dupRes = await fetch(`${baseUrl}/api/course-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${studentToken}`,
      },
      body: JSON.stringify({
        courseName: uniqueCourseName,
        reason: "Submitting again immediately.",
      }),
    });
    const dupData = await dupRes.json();
    console.log("  Status:", dupRes.status);
    console.log("  Message:", dupData.message);
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate submission, got ${dupRes.status}`);
    }
    console.log("✓ Correctly rejected duplicate submission with 409.");

    // 4. Student queries own requests
    console.log("\n4. Testing GET /api/course-requests/my...");
    const myRes = await fetch(`${baseUrl}/api/course-requests/my`, {
      headers: { Cookie: `token=${studentToken}` },
    });
    const myData = await myRes.json();
    console.log("  Status:", myRes.status);
    console.log("  Total my requests:", myData.requests?.length);
    if (myRes.status !== 200 || !Array.isArray(myData.requests)) {
      throw new Error("Failed to fetch user requests");
    }
    console.log("✓ User successfully fetched their submitted course requests.");

    // 5. Student tries to access admin endpoint (Must be 403 Forbidden)
    console.log("\n5. Testing student access to GET /api/admin/course-requests (Security check)...");
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/course-requests`, {
      headers: { Cookie: `token=${studentToken}` },
    });
    console.log("  Status:", forbiddenRes.status);
    if (forbiddenRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin, got ${forbiddenRes.status}`);
    }
    console.log("✓ Non-admin student blocked from admin endpoint with 403.");

    // 6. Admin accesses course-requests endpoint
    console.log("\n6. Testing admin access to GET /api/admin/course-requests...");
    const adminRes = await fetch(`${baseUrl}/api/admin/course-requests`, {
      headers: { Cookie: `token=${adminToken}` },
    });
    const adminData = await adminRes.json();
    console.log("  Status:", adminRes.status);
    console.log("  Total requests in system:", adminData.requests?.length);
    if (adminRes.status !== 200 || !Array.isArray(adminData.requests)) {
      throw new Error("Admin failed to list course requests");
    }
    console.log("✓ Admin successfully listed course requests.");

    // 7. Admin fetches single request details
    console.log(`\n7. Testing GET /api/admin/course-requests/${createdRequestId}...`);
    const detailRes = await fetch(`${baseUrl}/api/admin/course-requests/${createdRequestId}`, {
      headers: { Cookie: `token=${adminToken}` },
    });
    const detailData = await detailRes.json();
    console.log("  Status:", detailRes.status);
    console.log("  Course:", detailData.request?.courseName);
    console.log("  Requester:", detailData.request?.userName);
    if (detailRes.status !== 200 || !detailData.request) {
      throw new Error("Failed to get single request details");
    }
    console.log("✓ Admin successfully viewed request details.");

    // 8. Admin updates status
    console.log("\n8. Testing PATCH /api/admin/course-requests/:id/status to 'reviewing'...");
    const updateRes = await fetch(`${baseUrl}/api/admin/course-requests/${createdRequestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${adminToken}`,
      },
      body: JSON.stringify({ status: "reviewing" }),
    });
    const updateData = await updateRes.json();
    console.log("  Status:", updateRes.status);
    console.log("  New status in DB:", updateData.request?.status);
    if (updateRes.status !== 200 || updateData.request?.status !== "reviewing") {
      throw new Error("Failed to update status to reviewing");
    }
    console.log("✓ Admin successfully updated status to reviewing.");

    // 9. Admin sends invalid status
    console.log("\n9. Testing PATCH with invalid status...");
    const invalidStatusRes = await fetch(`${baseUrl}/api/admin/course-requests/${createdRequestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${adminToken}`,
      },
      body: JSON.stringify({ status: "invalid_status_xyz" }),
    });
    console.log("  Status:", invalidStatusRes.status);
    if (invalidStatusRes.status !== 400) {
      throw new Error(`Expected 400 for invalid status, got ${invalidStatusRes.status}`);
    }
    console.log("✓ Correctly rejected invalid status with 400.");

    console.log("\n=================================================");
    console.log(" ALL API ENDPOINT TESTS PASSED! ✓");
    console.log("=================================================");
  } catch (err) {
    console.error("\n❌ API TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    if (createdRequestId) {
      await CourseRequest.findByIdAndDelete(createdRequestId);
      console.log("✓ Cleaned up created test request.");
    }
    if (server) {
      server.close();
      console.log("✓ Closed HTTP test server.");
    }
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB.");
  }
}

runApiTests();
