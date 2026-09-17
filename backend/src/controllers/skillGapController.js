import AttemptResult from "../models/AttemptResult.js";
import ConceptRootAnalysis from "../models/ConceptRootAnalysis.js";
import SkillGapAnalysis from "../models/SkillGapAnalysis.js";
import { analyzeSkillGapWithAI } from "../services/geminiService.js";

/**
 * GET /api/skill-gap
 * Returns personalized Skill Gap analysis based on AI mapping of real assessment performance.
 */
export async function getSkillGap(req, res) {
  try {
    const user = req.user;
    const attempts = await AttemptResult.find({ userId: user._id }).sort({ completedAt: -1 }).lean();
    const careerGoal = user.onboardingProfile?.careerGoal || user.selectedField || "";

    if (!attempts || attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            careerGoal,
          },
        },
      });
    }

    const latestAttemptId = attempts[0]._id;

    // Check Cache
    const cachedAnalysis = await SkillGapAnalysis.findOne({
      userId: user._id,
      latestAttemptId,
    }).lean();

    let aiAnalysis;
    if (cachedAnalysis && cachedAnalysis.analysis) {
      aiAnalysis = cachedAnalysis.analysis;
    } else {
      // Fetch Concept Root Context
      const conceptRoots = await ConceptRootAnalysis.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Trigger AI
      try {
        aiAnalysis = await analyzeSkillGapWithAI(careerGoal, attempts, conceptRoots);
        
        // Save to cache
        await SkillGapAnalysis.create({
          userId: user._id,
          latestAttemptId,
          analysis: aiAnalysis
        });
      } catch (aiErr) {
        if (aiErr.message === "AI_SERVICE_UNAVAILABLE") {
          return res.status(503).json({
            success: false,
            error: "AI_SERVICE_UNAVAILABLE",
            message: "AI analysis is temporarily unavailable."
          });
        }
        throw aiErr;
      }
    }

    // Map AI analysis to the expected UI payload shape where possible,
    // and provide the raw new rich AI analysis inside it.
    
    // For legacy UI compatibility we calculate avgScore:
    const totalAttempts = attempts.length;
    const avgScore = Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts);
    
    return res.json({
      success: true,
      data: {
        hasData: true,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          careerGoal,
        },
        performance: {
          overallScore: avgScore,
          totalAssessments: totalAttempts,
          strongAreasCount: aiAnalysis.skills.filter(s => s.gap === 0).length,
          improvingAreasCount: aiAnalysis.skills.filter(s => s.gap > 0 && s.gap < 15).length,
          weakAreasCount: aiAnalysis.skills.filter(s => s.gap >= 15).length,
        },
        skills: {
          // Send the full raw AI rich object
          aiAnalysis,
          
          // Legacy backwards compatibility maps for the frontend to easily render if not fully updated yet
          skillGaps: aiAnalysis.skills.filter(s => s.gap > 0).map(s => ({
            name: s.skill,
            description: s.reason,
            current: s.currentScore,
            target: s.requiredScore,
            gap: s.gap,
            priority: s.priority
          })),
          strengths: aiAnalysis.skills.filter(s => s.gap === 0).map(s => s.skill),
        }
      },
    });
  } catch (err) {
    console.error("[SkillGap] Error fetching SkillGap data:", err);
    return res.status(500).json({ success: false, message: "Unable to load your Skill Gap analysis. Please try again." });
  }
}
