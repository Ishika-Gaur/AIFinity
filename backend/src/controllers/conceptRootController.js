import AttemptResult from "../models/AttemptResult.js";
import User from "../models/User.js";
import { analyzeConceptRootWithAI } from "../services/geminiService.js";

/**
 * Maps an average score to a ConceptRoot status label.
 */
function scoreToStatus(avgScore) {
  if (avgScore >= 75) return "strong";
  if (avgScore >= 55) return "improving";
  return "attention";
}

/**
 * Computes per-category performance from attempts.
 * Returns array of { category, avgScore, count }
 */
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
 * Builds concept analysis from assessment attempts.
 * Returns learning diagnosis data with concepts, performance, and recommendations.
 */
function buildLearningDiagnosis(attempts, careerGoal) {
  if (!attempts || attempts.length === 0) {
    return {
      hasDiagnosis: false,
      concepts: [],
      mistakes: [],
      rootCauses: [],
      missingPrerequisites: [],
      recommendations: [],
    };
  }

  const catStats = getCategoryStats(attempts);
  
  // Build concept analysis from category performance
  const concepts = catStats.map((cat) => ({
    name: cat.category,
    performance: cat.avgScore,
    status: scoreToStatus(cat.avgScore),
    attemptCount: cat.count,
  }));

  // Build mistakes analysis from recent failed attempts
  const recentFailures = attempts.filter((a) => a.scorePercent < 60).slice(0, 5);
  const mistakes = recentFailures.map((attempt) => ({
    id: String(attempt._id),
    assessmentTitle: attempt.assessmentTitle,
    category: attempt.assessmentCategory || "General",
    scorePercent: attempt.scorePercent,
    completedAt: attempt.completedAt,
  }));

  // Build root cause analysis based on weak areas
  const weakAreas = catStats.filter((c) => c.avgScore < 60);
  const rootCauses = weakAreas.map((area) => ({
    concept: area.category,
    currentPerformance: area.avgScore,
    gap: 60 - area.avgScore,
  }));

  // Build missing prerequisites (concepts that need improvement before advancing)
  const missingPrerequisites = weakAreas
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3)
    .map((area) => ({
      concept: area.category,
      reason: `Performance at ${area.avgScore}% indicates foundational gaps`,
      priority: area.avgScore < 50 ? "high" : "medium",
    }));

  // Build personalized recommendations
  const recommendations = [];
  
  if (weakAreas.length > 0) {
    const weakest = weakAreas[0];
    recommendations.push({
      type: "concept_improvement",
      concept: weakest.category,
      currentScore: weakest.avgScore,
      targetScore: 75,
      action: `Practice ${weakest.category} fundamentals`,
      priority: "high",
    });
  }

  if (attempts.length > 0) {
    const avgScore = Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / attempts.length);
    if (avgScore >= 60) {
      const strongAreas = catStats.filter((c) => c.avgScore >= 75);
      if (strongAreas.length > 0) {
        recommendations.push({
          type: "advance",
          concept: strongAreas[0].category,
          currentScore: strongAreas[0].avgScore,
          action: `Build on your strength in ${strongAreas[0].category}`,
          priority: "medium",
        });
      }
    }
  }

  if (careerGoal) {
    recommendations.push({
      type: "career_alignment",
      concept: careerGoal,
      action: `Focus on skills relevant to ${careerGoal}`,
      priority: "medium",
    });
  }

  return {
    hasDiagnosis: true,
    concepts,
    mistakes,
    rootCauses,
    missingPrerequisites,
    recommendations,
  };
}

/**
 * GET /api/concept-root
 * Returns personalized ConceptRoot analysis for the authenticated user.
 */
export async function getConceptRoot(req, res) {
  try {
    const user = req.user;

    // Fetch all attempts for this user, sorted most recent first
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    const careerGoal = user.onboardingProfile?.careerGoal || user.selectedField || "";
    const learningDiagnosis = buildLearningDiagnosis(attempts, careerGoal);

    // Compute overall performance metrics
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts)
      : 0;

    const catStats = getCategoryStats(attempts);
    
    // Build performance summary
    const performance = {
      overallScore: avgScore,
      totalAssessments: totalAttempts,
      strongConcepts: catStats.filter((c) => c.avgScore >= 75).length,
      improvingConcepts: catStats.filter((c) => c.avgScore >= 55 && c.avgScore < 75).length,
      needsAttention: catStats.filter((c) => c.avgScore < 55).length,
      categoryPerformance: catStats,
    };

    return res.json({
      success: true,
      data: {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          careerGoal,
        },
        performance,
        learningDiagnosis,
      },
    });
  } catch (err) {
    console.error("[ConceptRoot] Error fetching ConceptRoot data:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to load your ConceptRoot analysis. Please try again.",
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
