import AttemptResult from "../models/AttemptResult.js";
import UserRoadmap from "../models/UserRoadmap.js";
import User from "../models/User.js";
import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";
import { chatCompletion } from "../services/geminiService.js";

function getCategoryStats(attempts) {
  const map = {};
  attempts.forEach((a) => {
    const cat = a.assessmentCategory || "General";
    if (!map[cat]) map[cat] = { sum: 0, count: 0 };
    map[cat].sum += a.scorePercent;
    map[cat].count++;
  });
  return Object.entries(map).map(([category, { sum, count }]) => ({
    category,
    avgScore: Math.round(sum / count),
    count,
  }));
}

/**
 * Generates a clean, concise title (max 5-6 words) from the user's first prompt
 */
function generateTitleFromPrompt(prompt) {
  if (!prompt || typeof prompt !== "string") return "New Chat";
  const clean = prompt.replace(/[^\w\s]/gi, "").trim();
  const words = clean.split(/\s+/).slice(0, 5).join(" ");
  if (!words) return "New Chat";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * GET /api/personal-intelligence/sessions
 * List all chat sessions for the authenticated user, newest first
 */
export const listSessions = async (req, res) => {
  try {
    const user = req.user;
    const sessions = await ChatSession.find({ userId: user._id })
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: String(s._id),
        title: s.title || "New Chat",
        lastMessageAt: s.lastMessageAt || s.createdAt,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("[PI listSessions] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load chat sessions." });
  }
};

/**
 * POST /api/personal-intelligence/sessions
 * Create a new blank session (equivalent to "+ New Chat")
 */
export const createSession = async (req, res) => {
  try {
    const user = req.user;
    const title = req.body?.title || "New Chat";
    const session = await ChatSession.create({
      userId: user._id,
      title,
      lastMessageAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      session: {
        id: String(session._id),
        title: session.title,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error("[PI createSession] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create new chat." });
  }
};

/**
 * GET /api/personal-intelligence/sessions/:id/messages
 * Fetches all messages for a specific session
 */
export const getSessionMessages = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const session = await ChatSession.findOne({ _id: id, userId: user._id }).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found." });
    }

    const messages = await ChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      session: {
        id: String(session._id),
        title: session.title,
        lastMessageAt: session.lastMessageAt,
      },
      messages: messages.map((m) => ({
        id: String(m._id),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("[PI getSessionMessages] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load session messages." });
  }
};

/**
 * POST /api/personal-intelligence/chat
 * Handles sending a message in a session (or auto-creates a session if none provided)
 */
export const chatWithPI = async (req, res) => {
  try {
    const user = req.user;
    const { messages, sessionId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "Valid messages array is required." });
    }

    // 1. Resolve or create ChatSession
    let session = null;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: user._id });
    }

    const lastUserMsg = messages[messages.length - 1];

    if (!session) {
      // Auto-create new session with title derived from user's first prompt
      const generatedTitle = generateTitleFromPrompt(lastUserMsg?.content);
      session = await ChatSession.create({
        userId: user._id,
        title: generatedTitle,
        lastMessageAt: new Date(),
      });
    } else if (session.title === "New Chat" && lastUserMsg?.content) {
      // If session had placeholder title, update it with user's prompt
      session.title = generateTitleFromPrompt(lastUserMsg.content);
    }

    // 2. Persist incoming user message
    if (lastUserMsg && lastUserMsg.role === "user" && lastUserMsg.content?.trim()) {
      await ChatMessage.create({
        sessionId: session._id,
        userId: user._id,
        role: "user",
        content: lastUserMsg.content.trim(),
      });
    }

    // 3. Fetch user context from database
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts)
      : 0;

    const careerGoal = user.onboardingProfile?.careerGoal || user.selectedField || "Not specified";
    const catStats = getCategoryStats(attempts);

    const strongCats = catStats.filter((c) => c.avgScore >= 75).map((c) => `${c.category} (${c.avgScore}%)`);
    const weakCats = catStats.filter((c) => c.avgScore < 60).map((c) => `${c.category} (${c.avgScore}%)`);

    let mistakePatterns = [];
    if (totalAttempts > 0) {
      mistakePatterns = attempts.flatMap((a) =>
        (a.questionResults || [])
          .filter((q) => q.status === "incorrect")
          .map((q) => q.concept || q.questionText)
      ).filter(Boolean);
    }

    const mistakeCounts = {};
    mistakePatterns.forEach((m) => (mistakeCounts[m] = (mistakeCounts[m] || 0) + 1));
    const topMistakes = Object.entries(mistakeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept, count]) => `${concept} (${count} times)`);

    const roadmapDoc = await UserRoadmap.findOne({ userId: user._id }).lean();
    let currentRoadmapStage = "No active roadmap stage";
    if (roadmapDoc && roadmapDoc.stages) {
      const activeStage = roadmapDoc.stages.find((s) => s.status === "in_progress" || s.status === "current");
      if (activeStage) currentRoadmapStage = activeStage.title;
    }

    // 4. Build system prompt
    const systemPrompt = `You are "AIFinity Personal Intelligence", an elite, personalized AI learning companion.
You must NOT act like a generic assistant. Your primary advantage is that you have direct access to the user's real learning journey and assessment performance data.

--- USER PROFILE & CONTEXT ---
Name: ${user.name}
Target Career Goal: ${careerGoal}
Total Assessments Completed: ${totalAttempts}
Overall Average Score: ${avgScore}%
Strongest Topics: ${strongCats.length ? strongCats.join(", ") : "None yet"}
Weakest Topics (MistakeMap/SkillGap): ${weakCats.length ? weakCats.join(", ") : "None yet"}
Top Mistake Concepts: ${topMistakes.length ? topMistakes.join(", ") : "None yet"}
Current Roadmap Stage: ${currentRoadmapStage}
------------------------------

Instructions:
1. Always base your insight on the user's ACTUAL data provided above.
2. If the user has 0 assessments, encourage them to take an assessment first.
3. Keep your tone encouraging and professional.
4. NEVER invent performance data. Use ONLY the data provided.
5. You MUST strictly follow this exact format:

🎯 Your Focus
[One short paragraph identifying their primary focus or gap.]

💡 Why This Matters
[One or two short sentences explaining the insight based on their data (e.g. mistakes made).]

⚡ What To Do Next
[One concrete, actionable step they can take today.]

📈 Target
[One measurable target, e.g. "Score: 24% → 50%+" or "Master 2 new concepts"]

6. Keep the entire response between 100-150 words maximum. Do NOT generate long study plans, tables, or essays. Do not use excessive emojis. Make it extremely easy to scan in 10 seconds.`;

    // 5. Call Gemini
    const aiResponse = await chatCompletion(
      systemPrompt,
      messages.map((m) => ({ role: m.role, content: m.content }))
    );

    // 6. Persist AI assistant response
    if (aiResponse) {
      await ChatMessage.create({
        sessionId: session._id,
        userId: user._id,
        role: "assistant",
        content: aiResponse,
      });
    }

    // 7. Update session lastMessageAt
    session.lastMessageAt = new Date();
    await session.save();

    return res.json({
      success: true,
      message: aiResponse,
      session: {
        id: String(session._id),
        title: session.title,
        lastMessageAt: session.lastMessageAt,
      },
    });
  } catch (error) {
    console.error("[PI Controller] Error:", error);
    return res.status(500).json({ success: false, message: "Personal Intelligence is currently unavailable." });
  }
};

/**
 * DELETE /api/personal-intelligence/sessions/:id
 * Delete a specific chat session and all its messages
 */
export const deleteSession = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    await ChatMessage.deleteMany({ sessionId: id, userId: user._id });
    await ChatSession.deleteOne({ _id: id, userId: user._id });

    return res.json({
      success: true,
      message: "Chat session deleted successfully.",
    });
  } catch (error) {
    console.error("[PI deleteSession] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete chat session." });
  }
};

/**
 * DELETE /api/personal-intelligence/sessions
 * Clears all chat sessions and messages for the user
 */
export const clearAllSessions = async (req, res) => {
  try {
    const user = req.user;
    await ChatMessage.deleteMany({ userId: user._id });
    await ChatSession.deleteMany({ userId: user._id });

    return res.json({
      success: true,
      message: "All chat conversations cleared successfully.",
    });
  } catch (error) {
    console.error("[PI clearAllSessions] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear conversations." });
  }
};
