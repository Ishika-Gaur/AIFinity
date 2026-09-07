import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  chatWithPI,
  getChatHistory,
  clearChatHistory,
} from "../controllers/personalIntelligenceController.js";

const router = express.Router();

router.use(authenticate);

// Chat completion
router.post("/chat", chatWithPI);

// User-specific history endpoints
router.get("/history", getChatHistory);
router.delete("/history", clearChatHistory);

export default router;
