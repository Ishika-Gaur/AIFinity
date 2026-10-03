import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getRevisionDashboard, startRevisionSession, completeRevision } from "../controllers/revisionController.js";

const router = express.Router();

router.use(authenticate); // Ensure all routes are protected

// Dashboard
router.get("/", getRevisionDashboard);

// Start/resume session
router.get("/:conceptId", startRevisionSession);

// Complete session
router.post("/:conceptId/complete", completeRevision);

export default router;
