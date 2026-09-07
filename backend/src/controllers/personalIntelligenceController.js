import AttemptResult from "../models/AttemptResult.js";
import UserRoadmap from "../models/UserRoadmap.js";
import User from "../models/User.js";
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

export const chatWithPI = async (req, res) => {
  try {
    const user = req.user;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Valid messages array is required." });
    }

    // 1. Fetch user data
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts)
      : 0;
    
    const careerGoal = user.onboardingProfile?.careerGoal || user.selectedField || "Not specified";
    const catStats = getCategoryStats(attempts);
    
    const strongCats = catStats.filter(c => c.avgScore >= 75).map(c => `${c.category} (${c.avgScore}%)`);
    const weakCats = catStats.filter(c => c.avgScore < 60).map(c => `${c.category} (${c.avgScore}%)`);
    
    let mistakePatterns = [];
    if (totalAttempts > 0) {
       mistakePatterns = attempts.flatMap(a => 
         (a.questionResults || []).filter(q => q.status === "incorrect").map(q => q.concept || q.questionText)
       ).filter(Boolean);
    }
    
    // Count frequencies of mistakes
    const mistakeCounts = {};
    mistakePatterns.forEach(m => mistakeCounts[m] = (mistakeCounts[m] || 0) + 1);
    const topMistakes = Object.entries(mistakeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept, count]) => `${concept} (${count} times)`);

    const roadmapDoc = await UserRoadmap.findOne({ userId: user._id }).lean();
    let currentRoadmapStage = "No active roadmap stage";
    if (roadmapDoc && roadmapDoc.stages) {
       const activeStage = roadmapDoc.stages.find(s => s.status === "in_progress" || s.status === "current");
       if (activeStage) currentRoadmapStage = activeStage.title;
    }

    // 2. Build system prompt
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

    // 3. Persist incoming user message
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === "user" && lastUserMsg.content?.trim()) {
      await ChatMessage.create({
        userId: user._id,
        role: "user",
        content: lastUserMsg.content.trim(),
      });
    }

    // 4. Call Gemini
    const aiResponse = await chatCompletion(systemPrompt, messages.map(m => ({ role: m.role, content: m.content })));

    // 5. Persist AI assistant response
    if (aiResponse) {
      await ChatMessage.create({
        userId: user._id,
        role: "assistant",
        content: aiResponse,
      });
    }

    return res.json({
      success: true,
      message: aiResponse,
    });
  } catch (error) {
    console.error("[PI Controller] Error:", error);
    return res.status(500).json({ success: false, message: "Personal Intelligence is currently unavailable." });
  }
};

/**
 * GET /api/personal-intelligence/history
 * Fetches user-specific chat conversation history
 */
export const getChatHistory = async (req, res) => {
  try {
    const user = req.user;
    const history = await ChatMessage.find({ userId: user._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      history: history.map((msg) => ({
        id: String(msg._id),
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error("[PI History] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load chat history." });
  }
};

/**
 * DELETE /api/personal-intelligence/history
 * Clears user-specific chat conversation history
 */
export const clearChatHistory = async (req, res) => {
  try {
    const user = req.user;
    await ChatMessage.deleteMany({ userId: user._id });
    return res.json({
      success: true,
      message: "Chat history cleared successfully.",
    });
  } catch (error) {
    console.error("[PI Clear History] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear chat history." });
  }
};
