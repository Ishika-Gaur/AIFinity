import AttemptResult from "../models/AttemptResult.js";
import User from "../models/User.js";
import UserRoadmap from "../models/UserRoadmap.js";
import { calculateSkillGap } from "../services/skillGapService.js";

/**
 * Role to required skills dictionary
 */
const ROLE_SKILLS_MAP = {
  "Software Developer": ["Problem Solving", "Programming", "Data Structures", "System Design", "Web APIs"],
  "Full-Stack Software Engineer": ["Frontend Architecture", "State Management & Hooks", "Node.js & Express APIs", "Databases & Security", "CI/CD & Cloud Deployment"],
  "Data Scientist": ["Python for Data Science", "Pandas & Dataframes", "Linear Algebra & Statistics", "Scikit-Learn Modeling", "Deep Learning & MLOps"],
  "Data Scientist & AI Specialist": ["Python Dataframes", "Statistical ML", "PyTorch / TensorFlow", "NLP & LLMs", "MLOps Pipelines"],
  "Financial & Investment Analyst": ["Financial Statements", "DCF & Valuation Frameworks", "Scenario & Sensitivity Analysis", "Equity Research & Pitching"],
  "Machine Learning Engineer": ["Python", "Machine Learning", "Deep Learning", "NLP & LLMs", "MLOps & Model Deployment"],
  "Frontend Engineer": ["HTML & CSS", "JavaScript ES6", "React Architecture", "State Management", "Web Performance"],
  "Backend Engineer": ["Node.js & Express", "Database Design", "API Security", "Caching & Architecture", "System Design"],
};

function getRequiredSkillsForRole(role) {
  if (!role) return ROLE_SKILLS_MAP["Full-Stack Software Engineer"];
  const normalised = role.toLowerCase();
  for (const [key, skills] of Object.entries(ROLE_SKILLS_MAP)) {
    if (normalised.includes(key.toLowerCase()) || key.toLowerCase().includes(normalised)) {
      return skills;
    }
  }
  return ["Core Logic", "Problem Solving", "Domain Fundamentals", "Best Practices", "Applied Execution"];
}

// ─────────────────────────────────────────────
// 1. GET /api/analytics/skill-gap
// ─────────────────────────────────────────────
export async function getSkillGapAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).lean();
    
    const targetCareer = user?.onboardingProfile?.careerGoal || user?.selectedField || "Full-Stack Software Engineer";
    
    // Call the single source of truth for SkillGap logic
    const gapData = await calculateSkillGap(userId, targetCareer);

    if (!gapData.hasData) {
      const requiredSkills = getRequiredSkillsForRole(targetCareer);
      return res.json({
        success: true,
        data: {
          hasHistory: false,
          targetCareer,
          demonstratedCapability: 0,
          averageGap: 40,
          matchPercentage: 0,
          strengths: [],
          weakSkills: requiredSkills.map((name) => ({ name, status: "attention", avgScore: 0 })),
          requiredSkills: requiredSkills.map((name) => ({ name, required: true, status: "upcoming" })),
          recommendations: [
            "Take your first assessment to calculate your personalized skill gap",
            `Complete assessments in ${targetCareer} topics`,
            "Review concept root causes for any missed questions",
          ],
        },
      });
    }

    const metrics = gapData.metrics;
    const requiredMetrics = metrics.filter(m => m.isRequirement);
    
    // Convert new metrics format to the legacy dashboard format
    const overallAvgScore = Math.round(metrics.reduce((sum, m) => sum + (m.currentPerformance || 0), 0) / (metrics.length || 1));
    const averageGap = Math.round(requiredMetrics.reduce((sum, m) => sum + (m.gap || 0), 0) / (requiredMetrics.length || 1));
    
    const strengths = metrics.filter(m => m.status === 'strong').map(m => m.name);
    if (strengths.length === 0 && overallAvgScore >= 60) {
      strengths.push("Core Reasoning", "Basic Concepts");
    }

    const weakSkills = metrics.filter(m => m.status === 'gap' || m.status === 'attention').map(m => ({
      name: m.name,
      avgScore: m.currentPerformance,
      gapPoints: m.gap,
      status: m.priority === 'high' ? 'attention' : 'improving'
    }));

    const skillsBreakdown = metrics.map(m => ({
      name: m.name,
      avgScore: m.currentPerformance,
      status: m.status === 'strong' ? 'strong' : m.status === 'improving' ? 'improving' : 'attention'
    }));

    const recommendations = [];
    if (weakSkills.length > 0) {
      weakSkills.forEach((w) => {
        recommendations.push(`Improve accuracy in ${w.name} (currently ${w.avgScore}%) to close the ${w.gapPoints}-point gap.`);
      });
    } else {
      recommendations.push("Your performance is strong across evaluated areas. Challenge yourself with advanced assessments.");
    }
    recommendations.push(`Align remaining milestones with your target career goal: ${targetCareer}.`);

    return res.json({
      success: true,
      data: {
        hasHistory: true,
        targetCareer,
        demonstratedCapability: overallAvgScore,
        averageGap,
        matchPercentage: overallAvgScore,
        strengths,
        weakSkills,
        skillsBreakdown,
        requiredSkills: requiredMetrics.map(m => ({
          name: m.name,
          status: m.status === 'strong' ? 'strong' : m.status === 'improving' ? 'improving' : 'attention',
          score: m.currentPerformance,
        })),
        recommendations: recommendations.slice(0, 4),
      },
    });
  } catch (err) {
    console.error("[Analytics] Error in getSkillGapAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to calculate SkillGap analytics." });
  }
}

// ─────────────────────────────────────────────
// 2. GET /api/analytics/mistake-map
// ─────────────────────────────────────────────
export async function getMistakeMapAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();

    if (!attempts || attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          hasHistory: false,
          totalMistakes: 0,
          mostCommonMistake: "No mistake patterns detected yet",
          occurrences: 0,
          topicProgress: [],
          mistakePatterns: [],
        },
      });
    }

    // Extract all question results
    const allQuestionResults = [];
    attempts.forEach((a) => {
      if (Array.isArray(a.questionResults)) {
        a.questionResults.forEach((q) => {
          allQuestionResults.push({
            ...q,
            assessmentCategory: a.assessmentCategory,
            completedAt: a.completedAt,
          });
        });
      }
    });

    const incorrectList = allQuestionResults.filter((q) => q.status === "incorrect" || q.status === "unanswered" || q.status === "partial");
    const totalMistakes = incorrectList.length;

    // Group mistakes by category
    const catMistakeMap = {};
    incorrectList.forEach((q) => {
      const cat = q.assessmentCategory || "General";
      if (!catMistakeMap[cat]) catMistakeMap[cat] = { count: 0, sampleQuestion: q.questionText, sampleExplanation: q.explanation };
      catMistakeMap[cat].count++;
    });

    const sortedMistakes = Object.entries(catMistakeMap).sort((a, b) => b[1].count - a[1].count);
    const topMistake = sortedMistakes[0];

    const topicProgress = sortedMistakes.map(([concept, data]) => ({
      concept,
      before: data.count + 3,
      after: data.count,
      needsAttention: data.count > 2,
      mistakePattern: `Recurring errors in ${concept} questions.`,
      whyItHappened: data.sampleExplanation || "Core concepts need further practice.",
      whatChanged: "Review recommended concept roots and attempt fresh practice questions.",
    }));

    return res.json({
      success: true,
      data: {
        hasHistory: true,
        totalMistakes,
        mostCommonMistake: topMistake ? `Low accuracy in ${topMistake[0]}` : "None detected",
        occurrences: topMistake ? topMistake[1].count : 0,
        improvement: Math.max(0, 30 - totalMistakes * 2),
        topicProgress,
        mistakePatterns: sortedMistakes.map(([concept, data]) => ({
          concept,
          occurrences: data.count,
          sampleQuestion: data.sampleQuestion,
          explanation: data.sampleExplanation,
        })),
      },
    });
  } catch (err) {
    console.error("[Analytics] Error in getMistakeMapAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to calculate MistakeMap analytics." });
  }
}

// ─────────────────────────────────────────────
// 3. GET /api/analytics/concept-root
// ─────────────────────────────────────────────
export async function getConceptRootAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();

    if (!attempts || attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          hasHistory: false,
          analyzedCount: 0,
          strongCount: 0,
          attentionCount: 0,
          concepts: [],
        },
      });
    }

    let totalQuestionsAnalyzed = 0;
    const catMap = {};

    attempts.forEach((a) => {
      totalQuestionsAnalyzed += a.totalQuestions || 0;
      const cat = a.assessmentCategory || "General";
      if (!catMap[cat]) catMap[cat] = { sum: 0, count: 0 };
      catMap[cat].sum += a.scorePercent;
      catMap[cat].count++;
    });

    const concepts = Object.entries(catMap).map(([name, { sum, count }]) => {
      const avgScore = Math.round(sum / count);
      return {
        name,
        avgScore,
        status: avgScore >= 75 ? "strong" : avgScore >= 55 ? "improving" : "attention",
        rootCause: avgScore >= 75
          ? "Solid conceptual foundation demonstrated."
          : avgScore >= 55
          ? "Good grasp of basic syntax and definitions; needs practice on complex edge cases."
          : "Gaps identified in core mechanics. Review foundational prerequisites.",
      };
    });

    const strongCount = concepts.filter((c) => c.status === "strong").length;
    const attentionCount = concepts.filter((c) => c.status === "attention").length;

    return res.json({
      success: true,
      data: {
        hasHistory: true,
        analyzedCount: totalQuestionsAnalyzed,
        strongCount,
        attentionCount,
        concepts,
      },
    });
  } catch (err) {
    console.error("[Analytics] Error in getConceptRootAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to calculate ConceptRoot analytics." });
  }
}

// ─────────────────────────────────────────────
// HELPER: Generate personalized roadmap stages from real assessment data
// ─────────────────────────────────────────────
export async function generatePersonalizedRoadmap(userId, customTargetCareer = null) {
  const user = await User.findById(userId).lean();
  const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
  const existingRoadmap = await UserRoadmap.findOne({ userId }).lean();

  const selectedField = user?.selectedField || user?.onboardingProfile?.field || "Technology";
  const targetCareer = customTargetCareer || existingRoadmap?.targetCareer || user?.onboardingProfile?.careerGoal || selectedField;

  if (!attempts || attempts.length === 0) {
    return {
      hasHistory: false,
      userId,
      targetCareer,
      selectedField,
      readinessScore: 0,
      completedStageIds: [],
      stages: [],
    };
  }

  const totalAttempts = attempts.length;
  const overallAvgScore = Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts);

  // Group performance by category/topic
  const catMap = {};
  const conceptMap = {};
  let totalMistakes = 0;
  let totalCorrect = 0;
  attempts.forEach((a) => {
    const cat = a.assessmentCategory || "General";
    if (!catMap[cat]) {
      catMap[cat] = { sum: 0, count: 0, totalQuestions: 0, incorrect: 0, sampleExplanations: [] };
    }
    catMap[cat].sum += a.scorePercent;
    catMap[cat].count++;
    catMap[cat].totalQuestions += a.totalQuestions || 0;
    catMap[cat].incorrect += a.incorrectCount || 0;
    totalMistakes += a.incorrectCount || 0;
    totalCorrect += a.correctCount || 0;

    if (Array.isArray(a.questionResults)) {
      a.questionResults.forEach((q) => {
        const concept = String(q.concept || cat).trim() || cat;
        if (!conceptMap[concept]) {
          conceptMap[concept] = { correct: 0, incorrect: 0, total: 0, explanations: [] };
        }
        conceptMap[concept].total += 1;
        if (q.isCorrect || q.status === "correct") {
          conceptMap[concept].correct += 1;
        } else {
          conceptMap[concept].incorrect += 1;
        }
        if (!q.isCorrect && q.explanation && catMap[cat].sampleExplanations.length < 3) {
          catMap[cat].sampleExplanations.push(q.explanation);
        }
        if (!q.isCorrect && q.explanation && conceptMap[concept].explanations.length < 2) {
          conceptMap[concept].explanations.push(q.explanation);
        }
      });
    }
  });

  const categoryStats = Object.entries(catMap).map(([category, data]) => ({
    category,
    avgScore: Math.round(data.sum / data.count),
    count: data.count,
    incorrect: data.incorrect,
    sampleExplanations: data.sampleExplanations,
  }));

  // Prefer the real per-question concept data when available. Older attempts
  // without concept metadata safely fall back to their assessment category.
  const conceptStats = Object.entries(conceptMap).map(([concept, data]) => ({
    category: concept,
    avgScore: Math.round((data.correct / Math.max(data.total, 1)) * 100),
    count: data.total,
    incorrect: data.incorrect,
    sampleExplanations: data.explanations,
  }));
  const learningStats = conceptStats.length > 0 ? conceptStats : categoryStats;

  // Identify weak concepts (accuracy < 70% or incorrect > 0)
  const weakConcepts = learningStats.filter((c) => c.avgScore < 70 || c.incorrect > 0).sort((a, b) => a.avgScore - b.avgScore);
  const strongConcepts = learningStats.filter((c) => c.avgScore >= 75);

  const completedSet = new Set(existingRoadmap?.completedStageIds || []);

  // Determine stage 1 (Foundations & Weak Concepts)
  const phase1Concepts = [];
  let phase1Why = "";
  let phase1Priority = "Standard";
  let phase1Status = "current";

  if (weakConcepts.length > 0) {
    weakConcepts.forEach((wc) => phase1Concepts.push(wc.category));
    const topWeak = weakConcepts[0];
    phase1Priority = "High"; // WEAK CONCEPTS AUTOMATICALLY RECEIVE HIGHER PRIORITY
    phase1Why = `Your assessment history contains ${totalCorrect} correct and ${totalMistakes} incorrect answers. Accuracy in ${topWeak.category} is ${topWeak.avgScore}% with ${topWeak.incorrect} missed question(s), so this is your highest-priority learning need.`;
  } else if (overallAvgScore >= 75) {
    phase1Concepts.push("Programming Fundamentals", "Data Structures Basics", "Core Theory & Best Practices");
    phase1Why = `Demonstrated strong baseline score of ${overallAvgScore}%. Foundational prerequisites are fully mastered.`;
    phase1Status = "completed";
  } else {
    phase1Concepts.push("Foundational Theory", "Core Domain Concepts", "Environment & Tools Setup");
    phase1Why = `Current assessment score is ${overallAvgScore}%. Master basic fundamentals to solidify core prerequisites.`;
  }

  // Ensure unique concepts in Phase 1
  const uniquePhase1Concepts = [...new Set(phase1Concepts)];

  // Stage 2: Core Concepts & SkillGap Alignment
  const phase2Concepts = [];
  const requiredRoleSkills = getRequiredSkillsForRole(targetCareer);
  requiredRoleSkills.forEach((skill) => {
    if (!uniquePhase1Concepts.includes(skill)) {
      phase2Concepts.push(skill);
    }
  });
  if (phase2Concepts.length === 0) {
    phase2Concepts.push("System Architecture", "API Integration", "State Management & Optimization");
  }

  let phase2Priority = "Medium";
  let phase2Why = `SkillGap analysis indicates a ${100 - overallAvgScore}-point opportunity gap for ${targetCareer}. Focus on building core professional competencies in these areas.`;
  if (overallAvgScore < 60) {
    phase2Priority = "High";
  }

  // Stage 3: use the same missed-question data as MistakeMap and ConceptRoot.
  const phase3Concepts = weakConcepts
    .sort((a, b) => b.incorrect - a.incorrect || a.avgScore - b.avgScore)
    .slice(0, 5)
    .map((concept) => `${concept.category} targeted practice`);
  if (phase3Concepts.length === 0) {
    phase3Concepts.push(...strongConcepts.slice(0, 5).map((concept) => `${concept.category} applied practice`));
  }
  const phase3Why = totalMistakes > 0
    ? `MistakeMap found ${totalMistakes} missed question(s), concentrated in ${weakConcepts.slice(0, 3).map((concept) => concept.category).join(", ")}. Practice is ordered by those recurring error patterns.`
    : `Your completed questions show no recurring mistakes. Use applied practice in your strongest concepts to maintain and extend performance.`;

  // Stage 4: advanced work is chosen from demonstrated strengths and the
  // remaining target-career skill gap, never from a static roadmap template.
  const phase4Concepts = [...new Set([
    ...strongConcepts.map((concept) => `${concept.category} advanced applications`),
    ...requiredRoleSkills.filter((skill) => !uniquePhase1Concepts.includes(skill)),
  ])].slice(0, 5);
  if (phase4Concepts.length === 0) {
    phase4Concepts.push(...phase2Concepts.slice(0, 5));
  }
  const phase4Why = overallAvgScore >= 75
    ? `Your ${overallAvgScore}% assessment average supports advanced work in your strongest concepts and the remaining ${targetCareer} skill gap.`
    : `Advanced work unlocks after the foundation and practice phases address the concepts missed in your assessments.`;

  // Stage status determination
  let stage1Status = completedSet.has(1) ? "completed" : phase1Status;
  let stage2Status = completedSet.has(2) ? "completed" : (stage1Status === "completed" ? "current" : "upcoming");
  let stage3Status = completedSet.has(3) ? "completed" : (stage2Status === "completed" ? "current" : "upcoming");
  let stage4Status = completedSet.has(4) ? "completed" : (stage3Status === "completed" ? "current" : (overallAvgScore >= 80 ? "upcoming" : "locked"));

  // Compute readiness score
  const completedCount = [stage1Status, stage2Status, stage3Status, stage4Status].filter((s) => s === "completed").length;
  const readinessScore = Math.min(100, Math.max(overallAvgScore, Math.round((completedCount / 4) * 100)));

  const stages = [
    {
      id: 1,
      title: `Phase 1: ${weakConcepts.length > 0 ? "Foundations & Weak Concept Remediation" : "Programming & Core Foundations"}`,
      phase: "Foundations (0-25% Readiness)",
      status: stage1Status,
      duration: "4 Weeks",
      priority: phase1Priority, // Weak concepts get High priority
      why: phase1Why,
      progress: stage1Status === "completed" ? 100 : Math.min(90, Math.max(15, overallAvgScore)),
      concepts: uniquePhase1Concepts.slice(0, 5),
      description: weakConcepts.length > 0
        ? `Remediate identified weak concepts (${weakConcepts.map((w) => w.category).join(", ")}) and rebuild solid prerequisite knowledge.`
        : `Master baseline concepts, terminology, and core prerequisites for ${targetCareer}.`,
      questions: 20,
      isWeakConcept: weakConcepts.length > 0,
    },
    {
      id: 2,
      title: `Phase 2: Core Competencies & Skill Gap Alignment`,
      phase: "Core Competency (25-50% Readiness)",
      status: stage2Status,
      duration: "6 Weeks",
      priority: phase2Priority,
      why: phase2Why,
      progress: stage2Status === "completed" ? 100 : stage2Status === "current" ? 45 : 0,
      concepts: phase2Concepts.slice(0, 5),
      description: `Build hands-on competencies in essential ${targetCareer} topics aligned with your SkillGap evaluation.`,
      questions: 25,
      isWeakConcept: false,
    },
    {
      id: 3,
      title: `Phase 3: Applied Execution & Mistake Pattern Resolution`,
      phase: "Advanced Specialization (50-75% Readiness)",
      status: stage3Status,
      duration: "6 Weeks",
      priority: "Standard",
      why: phase3Why,
      progress: stage3Status === "completed" ? 100 : stage3Status === "current" ? 30 : 0,
      concepts: phase3Concepts,
      description: `Practice the concepts flagged by your MistakeMap and ConceptRoot analysis until their error patterns stop recurring.`,
      questions: 30,
      isWeakConcept: false,
    },
    {
      id: 4,
      title: `Phase 4: Advanced Skills & Job Readiness Portfolio`,
      phase: "Career Readiness (75-100% Job Ready)",
      status: stage4Status,
      duration: "8 Weeks",
      priority: overallAvgScore >= 80 ? "High" : "Standard",
      why: phase4Why,
      progress: stage4Status === "completed" ? 100 : stage4Status === "current" ? 20 : 0,
      concepts: phase4Concepts,
      description: `Advance through the remaining ${targetCareer} skills selected from your measured strengths and skill gaps.`,
      questions: 25,
      isWeakConcept: false,
    },
  ];

  // Save or update UserRoadmap in MongoDB
  const roadmapData = {
    userId,
    targetCareer,
    selectedField,
    readinessScore,
    hasHistory: true,
    completedStageIds: Array.from(completedSet),
    stages,
    lastEvaluatedAt: new Date(),
  };

  await UserRoadmap.findOneAndUpdate(
    { userId },
    roadmapData,
    { upsert: true, new: true }
  );

  return roadmapData;
}

// ─────────────────────────────────────────────
// 4. GET /api/analytics/roadmap
// ─────────────────────────────────────────────
export async function getRoadmapAnalytics(req, res) {
  try {
    const userId = req.user._id;

    // Generate or update roadmap using real user assessment results
    const roadmap = await generatePersonalizedRoadmap(userId);

    return res.json({
      success: true,
      data: roadmap,
    });
  } catch (err) {
    console.error("[Analytics] Error in getRoadmapAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to generate dynamic personalized roadmap." });
  }
}

// ─────────────────────────────────────────────
// 5. PUT /api/analytics/roadmap
// Persists user modifications (e.g. stage completion toggle, target career goal)
// ─────────────────────────────────────────────
export async function updateUserRoadmap(req, res) {
  try {
    const userId = req.user._id;
    const { stageId, customCareer, completedStageIds } = req.body;

    let userRoadmap = await UserRoadmap.findOne({ userId });

    let updatedCompletedIds = userRoadmap?.completedStageIds ? [...userRoadmap.completedStageIds] : [];

    if (Array.isArray(completedStageIds)) {
      updatedCompletedIds = completedStageIds;
    } else if (stageId != null) {
      const idx = updatedCompletedIds.indexOf(Number(stageId));
      if (idx >= 0) {
        updatedCompletedIds.splice(idx, 1);
      } else {
        updatedCompletedIds.push(Number(stageId));
      }
    }

    if (!userRoadmap) {
      userRoadmap = await UserRoadmap.create({
        userId,
        targetCareer: customCareer || "Full-Stack Software Engineer",
        completedStageIds: updatedCompletedIds,
      });
    } else {
      if (customCareer) userRoadmap.targetCareer = customCareer;
      userRoadmap.completedStageIds = updatedCompletedIds;
      await userRoadmap.save();
    }

    // Regenerate roadmap using updated parameters
    const updatedRoadmap = await generatePersonalizedRoadmap(userId, customCareer || userRoadmap.targetCareer);

    return res.json({
      success: true,
      data: updatedRoadmap,
    });
  } catch (err) {
    console.error("[Analytics] Error in updateUserRoadmap:", err);
    return res.status(500).json({ success: false, message: "Failed to update roadmap." });
  }
}
