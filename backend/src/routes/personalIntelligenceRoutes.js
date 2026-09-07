import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  chatWithPI,
  listSessions,
  createSession,
  getSessionMessages,
  deleteSession,
  clearAllSessions,
} from "../controllers/personalIntelligenceController.js";

const router = express.Router();

router.use(authenticate);

// Chat & Sessions
router.post("/chat", chatWithPI);
router.get("/sessions", listSessions);
router.post("/sessions", createSession);
router.get("/sessions/:id/messages", getSessionMessages);
router.delete("/sessions/:id", deleteSession);
router.delete("/sessions", clearAllSessions);

export default router;
