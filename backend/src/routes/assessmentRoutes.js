import express from "express";
import {
  createAssessment,
  getPublished,
  listAdmin,
  listPublished,
  removeAssessment,
  startAttempt,
  submitAttempt,
  syncAttemptResult,
  updateAssessment,
  generateAIAssessment,
  getPersonalizedAssessments,
  generateDailyAIAssessment,
  getDailyAssessmentStatus,
  evaluateAttemptWithAI,
} from "../controllers/assessmentController.js";
import { authenticate, isAdmin, optionalAuthenticate } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", listPublished);
router.get("/personalized", authenticate, getPersonalizedAssessments);
router.post("/generate-ai", authenticate, generateAIAssessment);
router.post("/daily-generate", authenticate, generateDailyAIAssessment);
router.get("/daily-status", authenticate, getDailyAssessmentStatus);
router.get("/admin/all", authenticate, isAdmin, listAdmin);
router.post("/admin", authenticate, isAdmin, createAssessment);
router.put("/admin/:id", authenticate, isAdmin, updateAssessment);
router.delete("/admin/:id", authenticate, isAdmin, removeAssessment);

// authenticate on start/submit/sync so req.user is available for attempt persistence
router.post("/sync-attempt", authenticate, syncAttemptResult);
router.get("/:id/start", authenticate, startAttempt);
router.post("/:id/submit", authenticate, submitAttempt);
router.post("/:id/evaluate-ai", authenticate, evaluateAttemptWithAI);
router.get("/:id", optionalAuthenticate, getPublished);

export default router;
