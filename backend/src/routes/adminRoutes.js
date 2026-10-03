import express from "express";
import {
  deleteUser,
  listUsers,
  getAnalytics,
  listContent,
  createContent,
  deleteContent,
  listReports,
  getSettings,
  updateSettings,
} from "../controllers/adminController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

import {
  listCourseRequests,
  getCourseRequestById,
  updateCourseRequestStatus,
} from "../controllers/courseRequestController.js";

const router = express.Router();
router.use(authenticate, isAdmin);

// Users
router.get("/users", listUsers);
router.delete("/users/:id", deleteUser);

// Platform Analytics & AI Telemetry
router.get("/analytics", getAnalytics);

// Learning Content
router.get("/content", listContent);
router.post("/content", createContent);
router.delete("/content/:id", deleteContent);

// Course Requests Management
router.get("/course-requests", listCourseRequests);
router.get("/course-requests/:id", getCourseRequestById);
router.patch("/course-requests/:id/status", updateCourseRequestStatus);
router.put("/course-requests/:id/status", updateCourseRequestStatus);

// Reports
router.get("/reports", listReports);

// Platform Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

export default router;
