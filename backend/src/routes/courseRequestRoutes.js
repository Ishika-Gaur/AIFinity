import express from "express";
import {
  createCourseRequest,
  getMyCourseRequests,
  listCourseRequests,
  getCourseRequestById,
  updateCourseRequestStatus,
} from "../controllers/courseRequestController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// User endpoints (Authenticated)
router.post("/", authenticate, createCourseRequest);
router.get("/my", authenticate, getMyCourseRequests);

// Admin endpoints
router.get("/", authenticate, isAdmin, listCourseRequests);
router.get("/:id", authenticate, isAdmin, getCourseRequestById);
router.patch("/:id/status", authenticate, isAdmin, updateCourseRequestStatus);
router.put("/:id/status", authenticate, isAdmin, updateCourseRequestStatus);

export default router;
