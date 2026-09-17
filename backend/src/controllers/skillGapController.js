import AttemptResult from "../models/AttemptResult.js";
import ConceptRootAnalysis from "../models/ConceptRootAnalysis.js";
import SkillGapAnalysis from "../models/SkillGapAnalysis.js";
import { analyzeSkillGapWithAI } from "../services/geminiService.js";
import { calculateSkillGap } from "../services/skillGapService.js";

/**
 * GET /api/skill-gap
 * Returns deterministic Skill Gap metrics and AI qualitative insights.
 */
export async function getSkillGap(req, res) {
  try {
    const user = req.user;
    const careerGoal = user.onboardingProfile?.careerGoal || user.selectedField || "";
    
    // 1. Calculate deterministic metrics
    const deterministicData = await calculateSkillGap(user._id, careerGoal);
    
    if (!deterministicData.hasData) {
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

    // Identify the latest attempt for caching
    const attempts = await AttemptResult.find({ userId: user._id }).sort({ completedAt: -1 }).select('_id').lean();
    const latestAttemptId = attempts[0]._id;

    // 2. Check Cache
    const cachedAnalysis = await SkillGapAnalysis.findOne({
      userId: user._id,
      latestAttemptId,
      careerGoal,
      calculationVersion: "2B" // Must match version to be valid
    }).lean();

    let aiInsights = null;
    let aiStatus = "pending";

    if (cachedAnalysis) {
      aiInsights = cachedAnalysis.aiInsights;
      aiStatus = cachedAnalysis.aiStatus;
    } else {
      // 3. Fetch Context for LLM Explanation
      const attemptsFull = await AttemptResult.find({ userId: user._id }).sort({ completedAt: -1 }).limit(10).lean();
      const attemptSummaries = attemptsFull.map(a => 
        `Assessment: ${a.assessmentTitle}, Score: ${a.scorePercent}%. Mistakes: ${(a.questionResults || []).filter(q => q.status === 'incorrect').map(q => q.concept).join(', ')}`
      ).join('\n');
      
      const conceptRoots = await ConceptRootAnalysis.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      const rootSummaries = conceptRoots.map(c => 
        `Concept Root Analysis: ${c.analysis?.primaryRootCause?.concept || ''} - ${c.analysis?.primaryRootCause?.explanation || ''}`
      ).join('\n');

      // 4. Trigger AI only for explanation
      try {
        const aiResponse = await analyzeSkillGapWithAI(careerGoal, deterministicData.metrics, attemptSummaries, rootSummaries);
        aiInsights = aiResponse;
        aiStatus = "completed";
      } catch (aiErr) {
        aiInsights = null;
        aiStatus = "unavailable";
        console.warn("[SkillGap] AI analysis unavailable:", aiErr.message);
      }
      
      // Save to cache (either full or missing AI)
      await SkillGapAnalysis.create({
        userId: user._id,
        latestAttemptId,
        careerGoal,
        calculationVersion: "2B",
        sourceAttemptCount: deterministicData.sourceAttemptCount,
        deterministicMetrics: deterministicData.metrics,
        aiInsights,
        aiStatus
      });
    }

    // 5. Construct final response aligning with frontend expectations while being deterministic
    const metrics = deterministicData.metrics;
    const overallScore = Math.round(metrics.filter(m => m.isRequirement).reduce((sum, m) => sum + (m.currentPerformance || 0), 0) / (metrics.filter(m => m.isRequirement).length || 1));
    
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
          overallScore,
          totalAssessments: deterministicData.sourceAttemptCount,
          strongAreasCount: metrics.filter(m => m.status === 'strong').length,
          improvingAreasCount: 0, // 'improving' status deprecated in 2B
          weakAreasCount: metrics.filter(m => m.status === 'gap' || m.status === 'attention').length,
          unmappedEvidenceCount: deterministicData.unmappedEvidenceCount
        },
        skills: {
          aiAnalysis: aiInsights,
          aiStatus,
          // Legacy mappings from new deterministic data
          skillGaps: metrics.filter(m => m.status === 'gap' || m.status === 'attention').map(m => {
            const insight = aiInsights?.insights?.find(i => i.skillId === m.skillId);
            return {
              name: m.name,
              description: insight?.reason || "Based on deterministic evidence, there is a gap between current performance and career requirements.",
              current: m.currentPerformance,
              target: m.requiredPerformance,
              gap: m.gap,
              priority: m.priority,
              confidence: m.confidence,
              actionPlan: insight?.actionPlan || null,
              practiceFocus: insight?.practiceFocus || null
            };
          }),
          strengths: metrics.filter(m => m.status === 'strong').map(m => m.name),
          allMetrics: metrics // Expose full deterministic table
        }
      },
    });
  } catch (err) {
    console.error("[SkillGap] Error fetching SkillGap data:", err);
    return res.status(500).json({ success: false, message: "Unable to load your Skill Gap analysis. Please try again." });
  }
}
