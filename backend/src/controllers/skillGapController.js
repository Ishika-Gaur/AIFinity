import AttemptResult from "../models/AttemptResult.js";
import { buildSkillGapAnalysis } from "../services/evidenceService.js";

/**
 * GET /api/skill-gap
 * Returns personalized Skill Gap analysis based on real assessment performance.
 */
export async function getSkillGap(req, res) {
  try {
    const user = req.user;
    const attempts = await AttemptResult.find({ userId: user._id }).sort({ completedAt: -1 }).lean();

    const careerGoal = user?.onboardingProfile?.careerGoal || user?.selectedField || "";
    const data = buildSkillGapAnalysis({ attempts, careerGoal, user });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("[SkillGap] Error fetching SkillGap data:", err);
    return res.status(500).json({ success: false, message: "Unable to load your Skill Gap analysis. Please try again." });
  }
}
