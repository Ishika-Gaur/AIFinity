import express from "express";
import {
  getRoadmapAnalytics,
  getUserRoadmaps,
  updateUserRoadmap,
  getProjectIdeas,
} from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

router.get("/roadmap", getRoadmapAnalytics);
router.get("/roadmaps", getUserRoadmaps);
router.put("/roadmap", updateUserRoadmap);
router.get("/project-ideas", getProjectIdeas);

export default router;
