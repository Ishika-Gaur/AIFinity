import express from "express";
import { getConceptRoot, analyzeConceptRoot } from "../controllers/conceptRootController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/concept-root/analyze — live AI diagnostic analysis (available for demo & users)
router.post("/analyze", analyzeConceptRoot);

// Authenticated ConceptRoot routes
router.use(authenticate);

// GET /api/concept-root — personalized ConceptRoot analysis for the authenticated user
router.get("/", getConceptRoot);

export default router;
