import express from "express";
import { getRoadmap, generateRoadmap, regenerateRoadmap, updateStepStatus } from "../controllers/roadmapController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getRoadmap);
router.post("/generate", authenticate, generateRoadmap);
router.post("/regenerate", authenticate, regenerateRoadmap);
router.patch("/step/:stepId", authenticate, updateStepStatus);

export default router;
