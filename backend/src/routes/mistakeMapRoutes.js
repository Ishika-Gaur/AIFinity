import express from "express";
import {
  getMistakeMap,
  getMistakeMapStatistics,
  getMistakeMapPatterns,
  generateMistakeMapAIInsights,
} from "../controllers/mistakeMapController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All MistakeMap routes require authentication
router.use(authenticate);

// GET /api/mistake-map — complete personalized Mistake Map analysis
router.get("/", getMistakeMap);

// GET /api/mistake-map/statistics — fast statistical summary
router.get("/statistics", getMistakeMapStatistics);

// GET /api/mistake-map/patterns — recurring weakness patterns & trends
router.get("/patterns", getMistakeMapPatterns);

// POST /api/mistake-map/ai-insights — trigger on-demand AI recommendations
router.post("/ai-insights", generateMistakeMapAIInsights);

export default router;
