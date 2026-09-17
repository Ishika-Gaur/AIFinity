import AttemptResult from "../models/AttemptResult.js";
import User from "../models/User.js";
import MistakeMapAnalysis from "../models/MistakeMapAnalysis.js";
import { buildMistakeMapAnalysis } from "../services/mistakeMapService.js";
import { generateMistakeMapInsightsWithAI } from "../services/geminiService.js";

// In-flight deduplication map: userId -> Promise<aiInsights>
const activeAIPromises = new Map();

/**
 * Fallback empty AI insights structure for accounts with 0 attempts.
 */
function getEmptyAIInsightsFallback() {
  return {
    summaryHeadline: "Complete your first assessment to unlock personalized mistake pattern analysis.",
    focusMore: [],
    lowerPriority: [],
    why: "No assessment attempts recorded yet. AI recommendations are dynamically generated once actual performance telemetry is available.",
    recommendedPractice: [],
    isInsufficientData: true,
  };
}

/**
 * GET /api/mistake-map
 * Returns full personalized Mistake Map telemetry, priority groupings,
 * mistake type distribution, longitudinal trends, and cached/persisted AI diagnostic insights.
 */
export async function getMistakeMap(req, res) {
  try {
    const user = req.user;
    const userProfile = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      careerGoal: user.onboardingProfile?.careerGoal || user.selectedField || "",
      selectedField: user.selectedField || user.onboardingProfile?.field || "",
      level: user.onboardingProfile?.level || "Beginner",
    };

    // Fetch all attempt results for the authenticated user
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    // Pure data-driven statistical analysis
    const analysis = buildMistakeMapAnalysis(attempts, userProfile);

    let aiInsights = null;

    if (!analysis.hasData || analysis.totalAttempts === 0) {
      aiInsights = getEmptyAIInsightsFallback();
    } else {
      // Check if existing persisted AI insights exist
      const existingRecord = await MistakeMapAnalysis.findOne({ userId: user._id })
        .sort({ updatedAt: -1 })
        .lean();

      if (existingRecord?.aiInsights && !existingRecord.aiInsights.isInsufficientData) {
        // Reuse existing persisted AI insights without hitting the LLM
        aiInsights = existingRecord.aiInsights;
      } else {
        // No valid insights exist yet: generate once and persist
        const userIdStr = String(user._id);
        if (activeAIPromises.has(userIdStr)) {
          aiInsights = await activeAIPromises.get(userIdStr);
        } else {
          const aiPromise = (async () => {
            try {
              const fresh = await generateMistakeMapInsightsWithAI(analysis, userProfile);
              if (fresh && !fresh.isInsufficientData) {
                await MistakeMapAnalysis.findOneAndUpdate(
                  { userId: user._id },
                  { aiInsights: fresh, lastGeneratedAt: new Date() },
                  { upsert: true, new: true }
                );
              }
              return fresh;
            } catch (err) {
              console.warn("[MistakeMap Controller] Initial AI generation failed, continuing:", err.message);
              return null;
            } finally {
              activeAIPromises.delete(userIdStr);
            }
          })();

          activeAIPromises.set(userIdStr, aiPromise);
          aiInsights = await aiPromise;
        }
      }
    }

    return res.json({
      success: true,
      data: {
        user: userProfile,
        ...analysis,
        aiInsights,
      },
    });
  } catch (err) {
    console.error("[MistakeMap Controller] Error fetching MistakeMap:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to load your Mistake Map analysis. Please try again.",
    });
  }
}

/**
 * GET /api/mistake-map/statistics
 * Returns raw and aggregated Mistake Map statistics without AI latency.
 */
export async function getMistakeMapStatistics(req, res) {
  try {
    const user = req.user;
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    const analysis = buildMistakeMapAnalysis(attempts, {
      careerGoal: user.onboardingProfile?.careerGoal || user.selectedField || "",
    });

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    console.error("[MistakeMap Controller] Error fetching statistics:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to load Mistake Map statistics.",
    });
  }
}

/**
 * GET /api/mistake-map/patterns
 * Returns recurring weakness patterns, high-priority concepts, and before/now trends.
 */
export async function getMistakeMapPatterns(req, res) {
  try {
    const user = req.user;
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    const analysis = buildMistakeMapAnalysis(attempts, {
      careerGoal: user.onboardingProfile?.careerGoal || user.selectedField || "",
    });

    return res.json({
      success: true,
      data: {
        hasData: analysis.hasData,
        summary: analysis.summary,
        recurringWeaknesses: analysis.highPriorityConcepts.filter((c) => c.isRecurringWeakness),
        highPriorityConcepts: analysis.highPriorityConcepts,
        needsPracticeConcepts: analysis.needsPracticeConcepts,
        strongConcepts: analysis.strongConcepts,
        trends: analysis.trends,
      },
    });
  } catch (err) {
    console.error("[MistakeMap Controller] Error fetching patterns:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to load Mistake Map patterns.",
    });
  }
}

/**
 * POST /api/mistake-map/ai-insights
 * Generates fresh AI recommendations on explicit demand, updates cached persistence, and deduplicates concurrent requests.
 */
export async function generateMistakeMapAIInsights(req, res) {
  try {
    const user = req.user;
    const userProfile = {
      careerGoal: user.onboardingProfile?.careerGoal || user.selectedField || "",
      selectedField: user.selectedField || user.onboardingProfile?.field || "",
      level: user.onboardingProfile?.level || "Beginner",
    };

    const userIdStr = String(user._id);
    if (activeAIPromises.has(userIdStr)) {
      const aiInsights = await activeAIPromises.get(userIdStr);
      return res.json({
        success: true,
        data: aiInsights,
      });
    }

    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    const analysis = buildMistakeMapAnalysis(attempts, userProfile);

    if (!analysis.hasData || analysis.totalAttempts === 0) {
      const emptyFallback = getEmptyAIInsightsFallback();
      return res.json({
        success: true,
        data: emptyFallback,
      });
    }

    const aiPromise = (async () => {
      try {
        const freshInsights = await generateMistakeMapInsightsWithAI(analysis, userProfile);
        if (freshInsights && !freshInsights.isInsufficientData) {
          await MistakeMapAnalysis.findOneAndUpdate(
            { userId: user._id },
            { aiInsights: freshInsights, lastGeneratedAt: new Date() },
            { upsert: true, new: true }
          );
        }
        return freshInsights;
      } finally {
        activeAIPromises.delete(userIdStr);
      }
    })();

    activeAIPromises.set(userIdStr, aiPromise);
    const aiInsights = await aiPromise;

    return res.json({
      success: true,
      data: aiInsights,
    });
  } catch (err) {
    console.error("[MistakeMap Controller] Error generating AI insights:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to generate Mistake Map AI insights.",
    });
  }
}
