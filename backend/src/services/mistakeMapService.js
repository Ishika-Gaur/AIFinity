/**
 * MistakeMap Service
 * Pure data analysis, statistical aggregation, and learning prioritization engine.
 * Computes concept-level and topic-level metrics, recurring weakness patterns,
 * before/now trends, and evidence-based learning priorities directly from MongoDB attempt results.
 */

/**
 * Normalizes and cleans raw category/topic strings.
 */
export function cleanName(name) {
  if (!name) return "General";
  try {
    return decodeURIComponent(String(name))
      .replace(/^ai_rec_/i, "")
      .replace(/_/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^(\w)/, (c) => c.toUpperCase());
  } catch {
    return String(name).replace(/^ai_rec_/i, "").replace(/_/g, " ").trim();
  }
}

/**
 * Maps numeric difficulty to a score multiplier (Easy: 1, Medium: 2, Hard: 3).
 */
function difficultyToWeight(diff) {
  const d = String(diff || "Medium").toLowerCase();
  if (d === "easy") return 1;
  if (d === "hard") return 3;
  return 2;
}

/**
 * Builds full data-driven Mistake Map telemetry from user's assessment attempts.
 * Handles:
 * - 0 attempts (graceful empty state)
 * - 1 attempt (baseline single-assessment state)
 * - Multiple attempts (longitudinal pattern recognition, recurring weaknesses, before/now trends)
 */
export function buildMistakeMapAnalysis(attempts = [], userProfile = {}) {
  if (!Array.isArray(attempts) || attempts.length === 0) {
    return {
      hasData: false,
      totalAttempts: 0,
      summary: {
        totalAttempts: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalMistakes: 0,
        overallAccuracy: 0,
        mistakeRate: 0,
        highPriorityCount: 0,
        needsPracticeCount: 0,
        strongCount: 0,
        mostCommonWeakness: "No assessment data yet",
        strongestConcept: null,
      },
      topics: [],
      concepts: [],
      highPriorityConcepts: [],
      needsPracticeConcepts: [],
      strongConcepts: [],
      mistakeDistribution: {
        breakdown: [
          { type: "CONCEPTUAL", label: "Conceptual Gap", count: 0, percentage: 0 },
          { type: "LOGICAL", label: "Logical Reasoning", count: 0, percentage: 0 },
          { type: "IMPLEMENTATION", label: "Implementation / Syntax", count: 0, percentage: 0 },
          { type: "CARELESS", label: "Careless / Calculation", count: 0, percentage: 0 },
          { type: "MISINTERPRETATION", label: "Misinterpretation", count: 0, percentage: 0 },
          { type: "TIME_MANAGEMENT", label: "Time Management", count: 0, percentage: 0 },
          { type: "UNKNOWN", label: "General Error", count: 0, percentage: 0 },
        ],
        totalMistakes: 0,
        dominantType: "NONE",
      },
      trends: {
        topicProgress: [],
        improvedCount: 0,
        regressedCount: 0,
        persistentCount: 0,
      },
      message: "No assessments completed yet. Take a benchmark assessment to start tracking your mistake patterns.",
    };
  }

  // Sort attempts chronologically ascending (earliest to latest) for accurate trend analysis
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.completedAt || 0) - new Date(b.completedAt || 0));

  // Extract all individual question results with contextual attempt metadata
  const allQuestions = [];
  sortedAttempts.forEach((attempt, attemptIndex) => {
    const attemptDate = attempt.completedAt ? new Date(attempt.completedAt) : new Date();
    const defaultTopic = attempt.assessmentField || attempt.assessmentCategory || "General";
    const defaultCategory = attempt.assessmentCategory || "General";

    if (Array.isArray(attempt.questionResults) && attempt.questionResults.length > 0) {
      attempt.questionResults.forEach((q, qIndex) => {
        const isCorrect = q.isCorrect === true || q.status === "correct" || (Number(q.marksAwarded) >= 7);
        const topic = cleanName(q.topic || defaultTopic);
        const concept = cleanName(q.concept || q.topic || defaultCategory);
        const difficulty = q.difficulty || "Medium";
        const mistakeType = isCorrect ? "" : (q.mistakeType || "UNKNOWN");

        allQuestions.push({
          questionId: q.questionId || `q_${attemptIndex}_${qIndex}`,
          questionText: q.questionText || "Question",
          topic,
          concept,
          difficulty,
          isCorrect,
          status: q.status || (isCorrect ? "correct" : "incorrect"),
          mistakeType,
          attemptId: String(attempt._id || attemptIndex),
          attemptIndex,
          completedAt: attemptDate,
        });
      });
    } else {
      // Fallback for attempts with aggregated counts but empty questionResults array
      const totalQ = attempt.totalQuestions || 1;
      const correctQ = attempt.correctCount || 0;
      const incorrectQ = totalQ - correctQ;
      const topic = cleanName(defaultTopic);
      const concept = cleanName(defaultCategory);

      for (let i = 0; i < correctQ; i++) {
        allQuestions.push({
          questionId: `fallback_${attemptIndex}_c_${i}`,
          questionText: `${concept} Question`,
          topic,
          concept,
          difficulty: "Medium",
          isCorrect: true,
          status: "correct",
          mistakeType: "",
          attemptId: String(attempt._id || attemptIndex),
          attemptIndex,
          completedAt: attemptDate,
        });
      }
      for (let i = 0; i < incorrectQ; i++) {
        allQuestions.push({
          questionId: `fallback_${attemptIndex}_inc_${i}`,
          questionText: `${concept} Question`,
          topic,
          concept,
          difficulty: "Medium",
          isCorrect: false,
          status: "incorrect",
          mistakeType: "UNKNOWN",
          attemptId: String(attempt._id || attemptIndex),
          attemptIndex,
          completedAt: attemptDate,
        });
      }
    }
  });

  const totalQuestions = allQuestions.length;
  const totalCorrect = allQuestions.filter((q) => q.isCorrect).length;
  const totalMistakes = totalQuestions - totalCorrect;
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const mistakeRate = totalQuestions > 0 ? Math.round((totalMistakes / totalQuestions) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Concept-Level Aggregation & Prioritization
  // ─────────────────────────────────────────────────────────────────────────────
  const conceptMap = new Map();

  allQuestions.forEach((q) => {
    if (!conceptMap.has(q.concept)) {
      conceptMap.set(q.concept, {
        concept: q.concept,
        topic: q.topic,
        questions: [],
        difficulties: { Easy: 0, Medium: 0, Hard: 0 },
        mistakeTypes: {
          CONCEPTUAL: 0,
          LOGICAL: 0,
          IMPLEMENTATION: 0,
          CARELESS: 0,
          MISINTERPRETATION: 0,
          TIME_MANAGEMENT: 0,
          UNKNOWN: 0,
        },
      });
    }

    const cData = conceptMap.get(q.concept);
    cData.questions.push(q);
    const diffKey = ["Easy", "Hard"].includes(q.difficulty) ? q.difficulty : "Medium";
    cData.difficulties[diffKey]++;

    if (!q.isCorrect && q.mistakeType) {
      if (cData.mistakeTypes[q.mistakeType] !== undefined) {
        cData.mistakeTypes[q.mistakeType]++;
      } else {
        cData.mistakeTypes.UNKNOWN++;
      }
    }
  });

  const conceptSummaries = Array.from(conceptMap.values()).map((cData) => {
    const qList = cData.questions;
    const totalAttempts = qList.length;
    const correctCount = qList.filter((q) => q.isCorrect).length;
    const mistakeCount = totalAttempts - correctCount;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

    // Difficulty score
    const weightedDiffSum = qList.reduce((sum, q) => sum + difficultyToWeight(q.difficulty), 0);
    const avgDifficultyScore = totalAttempts > 0 ? Number((weightedDiffSum / totalAttempts).toFixed(2)) : 2.0;

    // Longitudinal Before vs Now split
    let beforeMistakes = 0;
    let nowMistakes = 0;
    let beforeAccuracy = accuracy;
    let nowAccuracy = accuracy;
    let trend = "stable";

    if (totalAttempts >= 4 || sortedAttempts.length >= 2) {
      const splitIdx = Math.max(1, Math.floor(qList.length / 2));
      const beforeList = qList.slice(0, splitIdx);
      const nowList = qList.slice(splitIdx);

      beforeMistakes = beforeList.filter((q) => !q.isCorrect).length;
      nowMistakes = nowList.filter((q) => !q.isCorrect).length;

      beforeAccuracy = beforeList.length > 0 ? Math.round((beforeList.filter((q) => q.isCorrect).length / beforeList.length) * 100) : 0;
      nowAccuracy = nowList.length > 0 ? Math.round((nowList.filter((q) => q.isCorrect).length / nowList.length) * 100) : 0;

      if (nowMistakes < beforeMistakes) {
        trend = "improving";
      } else if (nowMistakes > beforeMistakes) {
        trend = "regressing";
      } else if (nowMistakes === beforeMistakes && nowMistakes > 0) {
        trend = "persistent";
      } else {
        trend = "mastered";
      }
    } else {
      // Single assessment baseline
      beforeMistakes = 0;
      nowMistakes = mistakeCount;
      trend = mistakeCount === 0 ? "mastered" : "emerging_gap";
    }

    // Recurring weakness: at least 2 mistakes AND accuracy < 60%
    const isRecurringWeakness = mistakeCount >= 2 && accuracy < 60;

    // Dominant mistake type for this concept
    const nonZeroMistakes = Object.entries(cData.mistakeTypes).filter(([type, count]) => count > 0);
    nonZeroMistakes.sort((a, b) => b[1] - a[1]);
    const primaryMistakeType = nonZeroMistakes.length > 0 ? nonZeroMistakes[0][0] : (mistakeCount > 0 ? "UNKNOWN" : "NONE");

    // Dynamic Learning Priority Calculation
    // Multi-factor formula: accuracy gap + mistake weight + recurring weakness penalty + recent failure signal + difficulty factor
    const priorityScore = (100 - accuracy) * 0.45 
      + (mistakeCount * 7) 
      + (isRecurringWeakness ? 25 : 0) 
      + (nowMistakes > 0 ? 15 : 0) 
      + (avgDifficultyScore >= 2.5 ? 6 : 0);

    let learningPriority = "NEEDS PRACTICE";
    if ((accuracy < 50 && totalAttempts >= 2) || (isRecurringWeakness && mistakeCount >= 2) || (accuracy < 40)) {
      learningPriority = "HIGH PRIORITY";
    } else if (accuracy >= 75 && (totalAttempts >= 2 || mistakeCount === 0)) {
      learningPriority = "LOWER PRIORITY / STRONG";
    } else {
      learningPriority = "NEEDS PRACTICE";
    }

    // Formulate evidence-based diagnostic explanation
    let evidence = "";
    if (mistakeCount === 0) {
      evidence = `Accuracy is 100% across ${totalAttempts} question${totalAttempts > 1 ? "s" : ""}. Concept demonstrates solid proficiency.`;
    } else {
      const mistakeBreakdownParts = nonZeroMistakes
        .map(([type, count]) => `${count} ${type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ")}`)
        .join(", ");

      const recurringClause = isRecurringWeakness
        ? ` Recurring weakness detected with ${mistakeCount} errors across attempts.`
        : "";

      const trendClause = trend === "improving"
        ? ` Recent progress shows improvement (${beforeMistakes} errors earlier → ${nowMistakes} recent).`
        : trend === "regressing"
        ? ` Errors increased in recent attempts (${beforeMistakes} earlier → ${nowMistakes} recent).`
        : "";

      evidence = `Accuracy is ${accuracy}% across ${totalAttempts} attempt${totalAttempts > 1 ? "s" : ""} with ${mistakeCount} mistake${mistakeCount > 1 ? "s" : ""} (${mistakeBreakdownParts || "general errors"}).${recurringClause}${trendClause}`;
    }

    // Chart-friendly pattern strings
    let mistakePattern = "";
    let whyItHappened = "";
    let whatChanged = "";

    if (trend === "improving") {
      mistakePattern = "Errors decreasing across recent questions";
      whyItHappened = "Targeted practice in earlier attempts helped bridge initial gaps";
      whatChanged = "Accuracy increased - concept transitioning to mastered";
    } else if (trend === "regressing") {
      mistakePattern = "Error frequency increased in recent tests";
      whyItHappened = "Recent attempts reveal unresolved misconceptions under difficulty";
      whatChanged = "Requires active review of fundamental principles";
    } else if (isRecurringWeakness) {
      mistakePattern = `Persistent errors (${primaryMistakeType.toLowerCase().replace(/_/g, " ")})`;
      whyItHappened = `Repeatedly struggling with ${primaryMistakeType.toLowerCase().replace(/_/g, " ")} steps in ${cData.concept}`;
      whatChanged = "Needs targeted deliberate practice rather than passive revision";
    } else if (accuracy >= 75) {
      mistakePattern = "High consistency and low error rate";
      whyItHappened = "Strong foundation demonstrated";
      whatChanged = "Concept well mastered";
    } else {
      mistakePattern = "Emerging error pattern";
      whyItHappened = "Initial assessment attempts show partial accuracy";
      whatChanged = "Practice additional questions to stabilize concept";
    }

    return {
      concept: cData.concept,
      topic: cData.topic,
      totalAttempts,
      correctCount,
      mistakeCount,
      accuracy,
      avgDifficultyScore,
      isRecurringWeakness,
      primaryMistakeType,
      mistakeTypeCounts: cData.mistakeTypes,
      learningPriority,
      priorityScore: Math.round(priorityScore),
      evidence,
      // Trend telemetry
      before: beforeMistakes,
      after: nowMistakes,
      beforeAccuracy,
      nowAccuracy,
      trend,
      needsAttention: learningPriority === "HIGH PRIORITY" || isRecurringWeakness,
      mistakePattern,
      whyItHappened,
      whatChanged,
    };
  });

  // Sort concepts: High Priority first (by priorityScore descending), then Needs Practice, then Strong
  conceptSummaries.sort((a, b) => b.priorityScore - a.priorityScore);

  const highPriorityConcepts = conceptSummaries.filter((c) => c.learningPriority === "HIGH PRIORITY");
  const needsPracticeConcepts = conceptSummaries.filter((c) => c.learningPriority === "NEEDS PRACTICE");
  const strongConcepts = conceptSummaries.filter((c) => c.learningPriority === "LOWER PRIORITY / STRONG");

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Topic-Level Aggregation
  // ─────────────────────────────────────────────────────────────────────────────
  const topicMap = new Map();

  allQuestions.forEach((q) => {
    if (!topicMap.has(q.topic)) {
      topicMap.set(q.topic, {
        topic: q.topic,
        questions: [],
        concepts: new Set(),
      });
    }
    const tData = topicMap.get(q.topic);
    tData.questions.push(q);
    tData.concepts.add(q.concept);
  });

  const topicSummaries = Array.from(topicMap.values()).map((tData) => {
    const qList = tData.questions;
    const totalQ = qList.length;
    const correctQ = qList.filter((q) => q.isCorrect).length;
    const mistakeQ = totalQ - correctQ;
    const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

    let status = "improving";
    if (accuracy >= 75) status = "strong";
    else if (accuracy < 55) status = "needs_attention";

    return {
      topic: tData.topic,
      totalQuestions: totalQ,
      correctCount: correctQ,
      mistakeCount: mistakeQ,
      accuracy,
      status,
      conceptCount: tData.concepts.size,
      concepts: Array.from(tData.concepts),
    };
  });

  topicSummaries.sort((a, b) => a.accuracy - b.accuracy);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. System-Wide Mistake Type Distribution
  // ─────────────────────────────────────────────────────────────────────────────
  const mistakeTypeTotals = {
    CONCEPTUAL: 0,
    LOGICAL: 0,
    IMPLEMENTATION: 0,
    CARELESS: 0,
    MISINTERPRETATION: 0,
    TIME_MANAGEMENT: 0,
    UNKNOWN: 0,
  };

  allQuestions.forEach((q) => {
    if (!q.isCorrect && q.mistakeType) {
      if (mistakeTypeTotals[q.mistakeType] !== undefined) {
        mistakeTypeTotals[q.mistakeType]++;
      } else {
        mistakeTypeTotals.UNKNOWN++;
      }
    }
  });

  const typeLabels = {
    CONCEPTUAL: "Conceptual Gap",
    LOGICAL: "Logical Reasoning",
    IMPLEMENTATION: "Implementation / Syntax",
    CARELESS: "Careless / Precision",
    MISINTERPRETATION: "Misinterpretation",
    TIME_MANAGEMENT: "Time Management",
    UNKNOWN: "General Error",
  };

  const distributionBreakdown = Object.entries(mistakeTypeTotals).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    count,
    percentage: totalMistakes > 0 ? Math.round((count / totalMistakes) * 100) : 0,
  }));

  const sortedDistribution = [...distributionBreakdown].sort((a, b) => b.count - a.count);
  const dominantType = totalMistakes > 0 && sortedDistribution[0].count > 0 ? sortedDistribution[0].type : "NONE";

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Summary & Trend Telemetry
  // ─────────────────────────────────────────────────────────────────────────────
  const mostCommonWeakness = highPriorityConcepts.length > 0
    ? highPriorityConcepts[0].concept
    : conceptSummaries.find((c) => c.mistakeCount > 0)?.concept || "No recurring weakness detected";

  const strongestConcept = strongConcepts.length > 0
    ? strongConcepts.sort((a, b) => b.accuracy - a.accuracy)[0].concept
    : null;

  const improvedCount = conceptSummaries.filter((c) => c.trend === "improving").length;
  const regressedCount = conceptSummaries.filter((c) => c.trend === "regressing").length;
  const persistentCount = conceptSummaries.filter((c) => c.isRecurringWeakness).length;

  return {
    hasData: true,
    totalAttempts: sortedAttempts.length,
    summary: {
      totalAttempts: sortedAttempts.length,
      totalQuestions,
      totalCorrect,
      totalMistakes,
      overallAccuracy,
      mistakeRate,
      highPriorityCount: highPriorityConcepts.length,
      needsPracticeCount: needsPracticeConcepts.length,
      strongCount: strongConcepts.length,
      mostCommonWeakness,
      strongestConcept,
    },
    topics: topicSummaries,
    concepts: conceptSummaries,
    highPriorityConcepts,
    needsPracticeConcepts,
    strongConcepts,
    mistakeDistribution: {
      breakdown: distributionBreakdown,
      totalMistakes,
      dominantType,
    },
    trends: {
      topicProgress: conceptSummaries.map((c) => ({
        concept: c.concept,
        topic: c.topic,
        before: c.before,
        after: c.after,
        needsAttention: c.needsAttention,
        trend: c.trend,
        mistakePattern: c.mistakePattern,
        whyItHappened: c.whyItHappened,
        whatChanged: c.whatChanged,
      })),
      improvedCount,
      regressedCount,
      persistentCount,
    },
  };
}
