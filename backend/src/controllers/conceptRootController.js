import AttemptResult from "../models/AttemptResult.js";
import ConceptRootAnalysis from "../models/ConceptRootAnalysis.js";
import { explainConceptRootWithAI } from "../services/geminiService.js";
import { calculateConceptRoot } from "../services/conceptRootService.js";

/**
 * GET /api/concept-root
 * Returns deterministic ConceptRoot analysis and AI explanation for the user.
 */
export async function getConceptRoot(req, res) {
  try {
    const user = req.user;
    
    // 1. Calculate deterministic root
    const deterministicData = await calculateConceptRoot(user._id);

    if (!deterministicData.hasData || !deterministicData.conceptId) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          user: { id: String(user._id), name: user.name }
        },
      });
    }

    // 2. Identify the latest attempt for caching
    const attempts = await AttemptResult.find({ userId: user._id }).sort({ completedAt: -1 }).select('_id').lean();
    const latestAttemptId = attempts[0]._id;

    // 3. Check Cache
    const cachedAnalysis = await ConceptRootAnalysis.findOne({
      userId: user._id,
      latestAttemptId,
      calculationVersion: "3B"
    }).lean();

    let aiInsights = null;
    let aiStatus = "pending";

    if (cachedAnalysis) {
      aiInsights = cachedAnalysis.aiInsights;
      aiStatus = cachedAnalysis.aiStatus;
    } else {
      // 4. Trigger AI only for explanation
      try {
        aiInsights = await explainConceptRootWithAI(deterministicData);
        aiStatus = "completed";
      } catch (aiErr) {
        aiInsights = null;
        aiStatus = "unavailable";
        console.warn("[ConceptRoot] AI analysis unavailable:", aiErr.message);
      }
      
      // Save to cache
      await ConceptRootAnalysis.create({
        userId: user._id,
        latestAttemptId,
        calculationVersion: "3B",
        deterministicRoot: deterministicData,
        aiInsights,
        aiStatus
      });
    }

    // 5. Construct final response
    return res.json({
      success: true,
      data: {
        hasData: true,
        user: { id: String(user._id), name: user.name },
        ...deterministicData,
        explanation: aiInsights,
        aiStatus
      },
    });
  } catch (err) {
    console.error("[ConceptRoot ERROR] CRITICAL ERROR IN GET CONCEPT ROOT:", err);
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: "Unable to load your ConceptRoot analysis. Please try again.",
      errorDetails: err.message
    });
  }
}

/**
 * POST /api/concept-root/analyze
 * Real-time AI diagnostic analysis for interactive ConceptRoot demo or student submission.
 */
export async function analyzeConceptRoot(req, res) {
  try {
    const { mode, question, userAnswer, code } = req.body;

    if (mode === "normal" && !userAnswer && !question) {
      return res.status(400).json({
        success: false,
        message: "Question and student answer are required for conceptual analysis.",
      });
    }

    if (mode === "code" && !code) {
      return res.status(400).json({
        success: false,
        message: "Code submission is required for code diagnostic analysis.",
      });
    }

    const diagnosis = await analyzeConceptRootWithAI({
      mode: mode || "normal",
      question,
      userAnswer,
      text: userAnswer,
      code,
    });

    return res.json({
      success: true,
      data: diagnosis,
    });
  } catch (err) {
    console.error("[ConceptRoot] Error running AI analysis:", err);
    return res.status(500).json({
      success: false,
      message: "AI diagnostic analysis failed: " + (err.message || "Please try again."),
    });
  }
}
