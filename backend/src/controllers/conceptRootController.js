import AttemptResult from "../models/AttemptResult.js";
import ConceptRootAnalysis from "../models/ConceptRootAnalysis.js";
import { 
  explainConceptRootWithAI, 
  analyzeConceptRootWithAI, 
  generateDeterministicConceptExplanation 
} from "../services/geminiService.js";
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
    const latestAttemptId = attempts && attempts.length > 0 ? attempts[0]._id : null;

    // 3. Check Cache with upgraded calculationVersion 4B
    const cachedAnalysis = latestAttemptId ? await ConceptRootAnalysis.findOne({
      userId: user._id,
      latestAttemptId,
      calculationVersion: "4B"
    }).lean() : null;

    let aiInsights = null;
    let aiStatus = "pending";

    // Validate that cached insights contain meaningful pedagogical text
    if (cachedAnalysis?.aiInsights && (cachedAnalysis.aiInsights.whyMistakeHappens || cachedAnalysis.aiInsights.explanation || cachedAnalysis.aiInsights.misconception)) {
      aiInsights = cachedAnalysis.aiInsights;
      aiStatus = cachedAnalysis.aiStatus || "completed";
    } else {
      // 4. Trigger AI or pedagogical engine
      const baseFallback = generateDeterministicConceptExplanation(deterministicData);

      try {
        const rawAi = await explainConceptRootWithAI(deterministicData);
        if (rawAi && typeof rawAi === "object") {
          aiInsights = {
            ...baseFallback,
            ...rawAi,
            whyMistakeHappens: rawAi.whyMistakeHappens || baseFallback.whyMistakeHappens,
            misconception: rawAi.misconception || baseFallback.misconception,
            explanation: rawAi.explanation || baseFallback.explanation,
            conceptRelationship: rawAi.conceptRelationship || baseFallback.conceptRelationship,
            mentalModel: rawAi.mentalModel || baseFallback.mentalModel,
            whatToUnderstand: (Array.isArray(rawAi.whatToUnderstand) && rawAi.whatToUnderstand.length > 0) ? rawAi.whatToUnderstand : baseFallback.whatToUnderstand,
            howToAvoid: (Array.isArray(rawAi.howToAvoid) && rawAi.howToAvoid.length > 0) ? rawAi.howToAvoid : baseFallback.howToAvoid,
            recommendedPractice: (Array.isArray(rawAi.recommendedPractice) && rawAi.recommendedPractice.length > 0) ? rawAi.recommendedPractice : baseFallback.recommendedPractice,
            recommendedRevision: (Array.isArray(rawAi.recommendedRevision) && rawAi.recommendedRevision.length > 0) ? rawAi.recommendedRevision : baseFallback.recommendedRevision,
          };
          aiStatus = "completed";
        } else {
          aiInsights = baseFallback;
          aiStatus = "fallback";
        }
      } catch (aiErr) {
        aiInsights = baseFallback;
        aiStatus = "fallback";
        console.warn("[ConceptRoot] AI analysis unavailable, used robust pedagogical fallback:", aiErr.message);
      }
      
      // Save to cache
      if (latestAttemptId) {
        try {
          await ConceptRootAnalysis.findOneAndUpdate(
            { userId: user._id, latestAttemptId, calculationVersion: "4B" },
            {
              userId: user._id,
              latestAttemptId,
              calculationVersion: "4B",
              deterministicRoot: deterministicData,
              aiInsights,
              aiStatus
            },
            { upsert: true, new: true }
          );
        } catch (cacheError) {
          console.warn("[ConceptRoot] Failed to cache analysis:", cacheError);
        }
      }
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
