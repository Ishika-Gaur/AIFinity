import AttemptResult from "../models/AttemptResult.js";
import User from "../models/User.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Returns the time-of-day greeting based on the current hour.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Returns date string YYYY-MM-DD in local time
 */
function getDateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Computes how many consecutive calendar days (ending today/yesterday)
 * have at least one attempt.
 */
function computeStreak(attempts) {
  if (!attempts || attempts.length === 0) return 0;

  // Get unique calendar date strings "YYYY-MM-DD" sorted descending
  const datestamps = [
    ...new Set(
      attempts.map((a) => {
        const d = new Date(a.completedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
    ),
  ].sort((a, b) => (a > b ? -1 : 1));

  if (datestamps.length === 0) return 0;

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  // Streak only counts if the most recent attempt is today or yesterday
  if (datestamps[0] !== todayStr && datestamps[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < datestamps.length; i++) {
    const prev = new Date(datestamps[i - 1]);
    const curr = new Date(datestamps[i]);
    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Groups attempts into time buckets for the chart.
 * Returns { "7D": [...], "30D": [...], "3M": [...] }
 */
function buildProgressSeries(attempts) {
  const now = new Date();

  const makeEmpty7D = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({ day, score: null, count: 0 }));
  };

  if (!attempts || attempts.length === 0) {
    return {
      "7D": [],
      "30D": [],
      "3M": [],
    };
  }

  // ── 7D: one bucket per day of the week (Mon-Sun) using last 7 days
  const dayBuckets = {}; // "YYYY-MM-DD" -> { sum, count, dayLabel }
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = getDateKey(d);
    dayBuckets[key] = { sum: 0, count: 0, dayLabel: dayNames[d.getDay()] };
  }

  attempts.forEach((a) => {
    const key = getDateKey(a.completedAt);
    if (dayBuckets[key]) {
      dayBuckets[key].sum += (a.scorePercent || 0);
      dayBuckets[key].count++;
    }
  });

  const series7D = Object.values(dayBuckets)
    .filter((b) => b.count > 0)
    .map((b) => ({ day: b.dayLabel, score: Math.round(b.sum / b.count) }));

  // ── 30D: one bucket per week (Week 1, Week 2, Week 3, Week 4)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const weekBuckets = { "Week 1": { sum: 0, count: 0 }, "Week 2": { sum: 0, count: 0 }, "Week 3": { sum: 0, count: 0 }, "Week 4": { sum: 0, count: 0 } };

  attempts.forEach((a) => {
    const d = new Date(a.completedAt);
    if (d >= thirtyDaysAgo) {
      const daysAgo = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      let weekKey;
      if (daysAgo >= 21) weekKey = "Week 1";
      else if (daysAgo >= 14) weekKey = "Week 2";
      else if (daysAgo >= 7) weekKey = "Week 3";
      else weekKey = "Week 4";
      weekBuckets[weekKey].sum += a.scorePercent;
      weekBuckets[weekKey].count++;
    }
  });

  const series30D = Object.entries(weekBuckets)
    .filter(([, b]) => b.count > 0)
    .map(([day, b]) => ({ day, score: Math.round(b.sum / b.count) }));

  // ── 3M: one bucket per month
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 2);
  threeMonthsAgo.setDate(1);
  threeMonthsAgo.setHours(0, 0, 0, 0);

  const monthBuckets = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthBuckets[key] = { sum: 0, count: 0, label: monthNames[d.getMonth()] };
  }

  attempts.forEach((a) => {
    const d = new Date(a.completedAt);
    if (d >= threeMonthsAgo) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthBuckets[key]) {
        monthBuckets[key].sum += a.scorePercent;
        monthBuckets[key].count++;
      }
    }
  });

  const series3M = Object.values(monthBuckets)
    .filter((b) => b.count > 0)
    .map((b) => ({ day: b.label, score: Math.round(b.sum / b.count) }));

  return { "7D": series7D, "30D": series30D, "3M": series3M };
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

function computeLongestStreak(attempts) {
  const dates = [...new Set(attempts.map((attempt) => getDateKey(attempt.completedAt)))].sort();
  let longest = 0;
  let current = 0;

  dates.forEach((date, index) => {
    if (index === 0) {
      current = 1;
    } else {
      const previous = new Date(dates[index - 1]);
      const next = new Date(date);
      current = Math.round((next - previous) / (1000 * 60 * 60 * 24)) === 1 ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
  });

  return longest;
}

function buildAnalyticsDetails(attempts, avgScore, currentStreak, categoryStats, progressSeries) {
  const chronological = [...attempts].reverse();
  const categoryHistory = {};
  chronological.forEach((attempt) => {
    const category = attempt.assessmentCategory || "General";
    if (!categoryHistory[category]) categoryHistory[category] = [];
    categoryHistory[category].push(attempt.scorePercent);
  });

  const skillImprovements = Object.entries(categoryHistory)
    .filter(([, scores]) => scores.length >= 2)
    .map(([category, scores]) => ({
      category,
      previousScore: scores[0],
      currentScore: scores[scores.length - 1],
      improvement: scores[scores.length - 1] - scores[0],
      attempts: scores.length,
    }))
    .filter((skill) => skill.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement);

  const recentScores = attempts.slice(0, 3);
  const previousScores = attempts.slice(3, 6);
  const recentAverage = recentScores.length
    ? Math.round(recentScores.reduce((sum, attempt) => sum + attempt.scorePercent, 0) / recentScores.length)
    : 0;
  const previousAverage = previousScores.length
    ? Math.round(previousScores.reduce((sum, attempt) => sum + attempt.scorePercent, 0) / previousScores.length)
    : null;

  const activityDates = new Set(attempts.map((attempt) => getDateKey(attempt.completedAt)));
  
  // Build monthly calendar for current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const monthlyCalendar = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    monthlyCalendar.push({ date: null, day: null, active: false, isPadding: true });
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const key = getDateKey(date);
    monthlyCalendar.push({
      date: key,
      day: day,
      active: activityDates.has(key),
      isPadding: false
    });
  }

  const assessmentHistory = attempts.map((attempt) => ({
    id: String(attempt._id),
    title: attempt.assessmentTitle,
    category: attempt.assessmentCategory || "General",
    field: attempt.assessmentField || "",
    scorePercent: attempt.scorePercent,
    correctCount: attempt.correctCount,
    gradableCount: attempt.gradableCount,
    totalQuestions: attempt.totalQuestions,
    completedAt: attempt.completedAt,
    status: attempt.scorePercent >= 60 ? "Completed" : "Needs Review",
  }));

  return {
    progress: {
      overallProgress: avgScore,
      trend: previousAverage === null ? null : recentAverage - previousAverage,
      recentAverage,
      completedActivities: attempts.length,
      strongAreas: categoryStats.filter((item) => item.avgScore >= 75).sort((a, b) => b.avgScore - a.avgScore),
      weakAreas: categoryStats.filter((item) => item.avgScore < 60).sort((a, b) => a.avgScore - b.avgScore),
      categoryPerformance: categoryStats,
      progressSeries,
      recentActivities: assessmentHistory.slice(0, 5),
    },
    assessments: {
      totalCompleted: attempts.length,
      averageScore: avgScore,
      highestScore: attempts.length ? Math.max(...attempts.map((attempt) => attempt.scorePercent)) : null,
      mostRecent: assessmentHistory[0] || null,
      history: assessmentHistory,
    },
    streak: {
      current: currentStreak,
      longest: computeLongestStreak(attempts),
      activeDays: activityDates.size,
      calendar: monthlyCalendar,
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      recentActivity: assessmentHistory.slice(0, 5),
    },
    skills: {
      improved: skillImprovements,
      strongAreas: categoryStats.filter((item) => item.avgScore >= 75).sort((a, b) => b.avgScore - a.avgScore),
      needsAttention: categoryStats.filter((item) => item.avgScore < 60).sort((a, b) => a.avgScore - b.avgScore),
      categoryPerformance: categoryStats,
    },
  };
}

/**
 * Maps an average score to a ConceptRoot/SkillGap status label.
 */
function scoreToStatus(avgScore) {
  if (avgScore >= 75) return "strong";
  if (avgScore >= 55) return "improving";
  return "attention";
}

/**
 * Derives an AI insight from recent attempt data.
 */
function buildAiInsight(attempts, careerGoal) {
  const defaultInsight = {
    title: "✦ AI LEARNING INSIGHT",
    observation: "Complete your first assessment to unlock personalized AI insights.",
    recommendationTitle: "RECOMMENDED NEXT STEP",
    recommendation: "Take an assessment to start building your learning profile.",
    cta: "Start Assessment",
    href: "/assessment",
  };

  if (!attempts || attempts.length === 0) return defaultInsight;

  const recent = attempts.slice(0, 5);
  const avgRecent = Math.round(recent.reduce((s, a) => s + a.scorePercent, 0) / recent.length);
  const trend = attempts.length >= 2 ? attempts[0].scorePercent - attempts[Math.min(4, attempts.length - 1)].scorePercent : 0;

  const catStats = getCategoryStats(attempts);
  const weakest = catStats.sort((a, b) => a.avgScore - b.avgScore)[0];
  const strongest = catStats.sort((a, b) => b.avgScore - a.avgScore)[0];

  let observation;
  let recommendation;

  if (trend > 5) {
    observation = `Your scores are trending upward (+${Math.round(trend)}% in recent assessments). ${weakest ? `Focus next on ${weakest.category} where your average is ${weakest.avgScore}%.` : "Keep up the momentum!"}`;
  } else if (trend < -5) {
    observation = `Your recent scores show a slight dip. ${weakest ? `${weakest.category} needs attention — your average there is ${weakest.avgScore}%.` : "Review recent mistakes to get back on track."}`;
  } else {
    observation = `Your accuracy is consistent at ${avgRecent}%. ${strongest ? `${strongest.category} is your strongest area at ${strongest.avgScore}%.` : ""} ${weakest && weakest !== strongest ? `${weakest.category} needs more practice.` : ""}`;
  }

  if (weakest) {
    recommendation = `Practice more ${weakest.category} assessments to improve your ${weakest.avgScore}% accuracy in that area${careerGoal ? ` — key for ${careerGoal}` : ""}.`;
  } else {
    recommendation = careerGoal
      ? `Continue building skills relevant to your ${careerGoal} career goal.`
      : "Take more assessments to unlock deeper personalized recommendations.";
  }

  return {
    title: "✦ AI LEARNING INSIGHT",
    observation,
    recommendationTitle: "RECOMMENDED NEXT STEP",
    recommendation,
    cta: "View Insight",
    href: "/concept-root",
  };
}

/**
 * Builds the roadmap based on career goal keywords.
 * Returns roadmap items with plausible statuses derived from assessments.
 */
function buildRoadmap(careerGoal, categoryStats) {
  const roadmapPresets = {
    "Machine Learning Engineer": ["Python", "Machine Learning", "Deep Learning", "NLP", "Generative AI"],
    "Full Stack AI Developer": ["Frontend Basics", "Full Stack APIs", "LLM Integration", "Vector Search", "Production AI"],
    "Data Scientist & AI Analyst": ["Data Analysis", "SQL & BigQuery", "Statistical ML", "Feature Engineering", "AI Dashboards"],
    "AI Research Engineer": ["Math & Calculus", "PyTorch DL", "Transformers", "RL Algorithms", "Model Research"],
    "GenAI & Prompt Engineer": ["Prompt Engineering", "LangChain", "RAG Search", "Fine-Tuning", "AI Agents"],
  };

  // Try to match career goal
  let steps = null;
  if (careerGoal) {
    const normalised = careerGoal.toLowerCase();
    for (const [key, val] of Object.entries(roadmapPresets)) {
      if (normalised.includes(key.toLowerCase()) || key.toLowerCase().includes(normalised)) {
        steps = val;
        break;
      }
    }
  }

  if (!steps) {
    // Generic fallback
    steps = ["Foundations", "Core Skills", "Advanced Topics", "Specialization", "Mastery"];
  }

  // Assign statuses: categories with assessments = completed/in_progress, rest = upcoming
  const doneCategories = new Set(categoryStats.filter((c) => c.avgScore >= 60).map((c) => c.category.toLowerCase()));
  const improvingCategories = new Set(categoryStats.filter((c) => c.avgScore < 60 && c.count > 0).map((c) => c.category.toLowerCase()));

  const items = steps.map((title, idx) => {
    const titleLower = title.toLowerCase();
    let status = "upcoming";

    // First item that matches a done category or first 1-2 items if user has assessments
    if (doneCategories.size > 0 && idx < doneCategories.size) {
      status = "completed";
    } else if (improvingCategories.size > 0 && status === "upcoming" && idx === Math.min(doneCategories.size, steps.length - 1)) {
      status = "in_progress";
    } else if (categoryStats.length === 0) {
      // No assessments at all → first is in_progress, rest upcoming
      status = idx === 0 ? "in_progress" : "upcoming";
    }

    // Directly check if title word appears in done categories
    if ([...doneCategories].some((cat) => titleLower.includes(cat) || cat.includes(titleLower))) {
      status = "completed";
    } else if ([...improvingCategories].some((cat) => titleLower.includes(cat) || cat.includes(titleLower))) {
      status = "in_progress";
    }

    return { id: String(idx + 1), title, status };
  });

  // Ensure at most one "in_progress" item
  let foundInProgress = false;
  for (const item of items) {
    if (item.status === "in_progress") {
      if (foundInProgress) item.status = "upcoming";
      else foundInProgress = true;
    }
  }

  return {
    title: "YOUR LEARNING ROADMAP",
    cta: "Continue Roadmap",
    href: "/roadmap",
    items,
  };
}

/**
 * Builds recommended next steps from weak areas and career goal.
 */
function buildRecommendations(catStats, careerGoal, attempts) {
  const recs = [];

  if (!attempts || attempts.length === 0) {
    return [
      { id: "r1", num: "01", text: "Take your first assessment to start tracking progress", href: "/assessment" },
      { id: "r2", num: "02", text: "Set up your career goal in the dashboard", href: "/dashboard" },
      { id: "r3", num: "03", text: "Explore available assessment topics", href: "/assessment" },
      { id: "r4", num: "04", text: careerGoal ? `Research skills needed for ${careerGoal}` : "Browse learning pathways", href: "/roadmap" },
    ];
  }

  // Weak categories (score < 70)
  const weakCats = catStats.filter((c) => c.avgScore < 70).sort((a, b) => a.avgScore - b.avgScore);
  const strongCats = catStats.filter((c) => c.avgScore >= 80);

  weakCats.slice(0, 2).forEach((cat, i) => {
    recs.push({
      id: `r${recs.length + 1}`,
      num: String(recs.length + 1).padStart(2, "0"),
      text: `Improve your ${cat.category} score (currently ${cat.avgScore}%)`,
      href: "/assessment",
    });
  });

  if (careerGoal) {
    recs.push({
      id: `r${recs.length + 1}`,
      num: String(recs.length + 1).padStart(2, "0"),
      text: `Continue building skills for ${careerGoal}`,
      href: "/roadmap",
    });
  }

  if (recs.length < 3) {
    recs.push({
      id: `r${recs.length + 1}`,
      num: String(recs.length + 1).padStart(2, "0"),
      text: "Review your mistakes to find patterns",
      href: "/mistake-map",
    });
  }

  if (recs.length < 4) {
    recs.push({
      id: `r${recs.length + 1}`,
      num: String(recs.length + 1).padStart(2, "0"),
      text: strongCats.length > 0 ? `Build on your strength in ${strongCats[0].category}` : "Take a new assessment to challenge yourself",
      href: "/assessment",
    });
  }

  return recs.slice(0, 4);
}

// ─────────────────────────────────────────────
// GET /api/dashboard
// ─────────────────────────────────────────────

export async function getDashboard(req, res) {
  try {
    const user = req.user;

    // Fetch all attempts for this user, sorted most recent first
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts)
      : 0;

    const careerGoal = user.onboardingProfile?.careerGoal || user.selectedField || "";
    const catStats = getCategoryStats(attempts);
    const streak = computeStreak(attempts);

    // ── Progress chart series
    const progressSeries = buildProgressSeries(attempts);
    const analytics = buildAnalyticsDetails(attempts, avgScore, streak, catStats, progressSeries);
    const skillsImproved = analytics.skills.improved.length;

    // ── Stats cards
    const stats = {
      overallProgress: {
        label: "OVERALL PROGRESS",
        value: avgScore,
        unit: "%",
        change: totalAttempts > 0 ? `Based on ${totalAttempts} assessment${totalAttempts !== 1 ? "s" : ""}` : "No assessments yet",
      },
      assessments: {
        label: "ASSESSMENTS",
        value: totalAttempts,
        unit: "",
        change: totalAttempts > 0 ? `Last: ${new Date(attempts[0].completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Take your first assessment",
      },
      learningStreak: {
        label: "LEARNING STREAK",
        value: streak,
        unit: " days",
        change: streak > 0 ? "Keep it going!" : "Complete an assessment today",
      },
      skillsImproved: {
        label: "SKILLS IMPROVED",
        value: skillsImproved,
        unit: "",
        change: skillsImproved > 0 ? "Across categories" : "Complete more assessments",
      },
    };

    // ── Recent assessments (last 5)
    const recentAssessments = attempts.slice(0, 5).map((a) => ({
      id: String(a._id),
      name: a.assessmentTitle,
      score: `${a.scorePercent}%`,
      date: new Date(a.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      status: a.scorePercent >= 60 ? "Completed" : "Needs Review",
      type: a.scorePercent >= 60 ? "success" : "warning",
    }));

    // ── ConceptRoot
    const conceptRoot = {
      title: "ConceptRoot AI",
      description: "Understand why you're getting questions wrong.",
      metrics: {
        analyzed: attempts.length, // Assessments analyzed
        strong: catStats.filter((c) => c.avgScore >= 75).length,
        needsAttention: catStats.filter((c) => c.avgScore < 60).length,
      },
      concepts: catStats
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 4)
        .map((c) => ({ name: c.category, status: scoreToStatus(c.avgScore) })),
      cta: "Explore ConceptRoot",
      href: "/concept-root",
    };

    // ── MistakeMap
    const weakestCat = catStats.sort((a, b) => a.avgScore - b.avgScore)[0];
    const mistakeMap = {
      title: "MistakeMap AI",
      description: "Discover the patterns behind your mistakes.",
      mostCommonMistake: weakestCat ? `Weakness in ${weakestCat.category}` : "No patterns yet",
      occurrences: weakestCat ? weakestCat.count : 0,
      improvement: 0, // placeholder, requires historical tracking per concept
      cta: "View MistakeMap",
      href: "/mistake-map",
    };

    // ── SkillGap: career readiness
    const skillGapSkills = catStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((c) => ({ name: c.category, status: scoreToStatus(c.avgScore) }));

    const skillGap = {
      title: "SkillGap AI",
      description: "See how your current skills compare with your career goal.",
      targetCareer: careerGoal || "Not set",
      matchPercentage: avgScore,
      skills: skillGapSkills,
      cta: "View Skill Gap",
      href: "/skill-gap",
    };

    // ── Roadmap
    const roadmap = buildRoadmap(careerGoal, catStats);

    // ── AI Insight
    const aiInsight = buildAiInsight(attempts, careerGoal);

    // ── Recommendations
    const recommendations = buildRecommendations(catStats, careerGoal, attempts);

    // ── Career Goal card data
    const careerGoalData = {
      title: "YOUR CAREER GOAL",
      role: careerGoal || "Not set",
      tags: careerGoal
        ? (user.onboardingProfile?.careerGoalTags || [careerGoal])
        : [],
      cta: "Update Goal",
    };

    // ── User info for header
    const userInfo = {
      name: user.name,
      greeting: getGreeting(),
      subtitle: careerGoal
        ? `Here's where your ${careerGoal} journey stands today.`
        : "Here's where your learning journey stands today.",
      streak,
    };

    return res.json({
      success: true,
      data: {
        user: userInfo,
        stats,
        analytics,
        progressSeries,
        aiInsight,
        conceptRoot,
        mistakeMap,
        skillGap,
        roadmap,
        assessments: recentAssessments,
        recommendations,
        careerGoal: careerGoalData,
      },
    });
  } catch (err) {
    console.error("[Dashboard] Error fetching dashboard data:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to load your dashboard. Please try again.",
    });
  }
}

// ─────────────────────────────────────────────
// PUT /api/dashboard/career-goal
// ─────────────────────────────────────────────

export async function updateCareerGoal(req, res) {
  try {
    const { role, tags } = req.body;

    if (!role || typeof role !== "string" || !role.trim()) {
      return res.status(400).json({
        success: false,
        message: "Career goal role is required.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Update career goal in onboardingProfile
    if (!user.onboardingProfile) {
      user.onboardingProfile = {};
    }
    user.onboardingProfile = {
      ...user.onboardingProfile,
      careerGoal: role.trim(),
      careerGoalTags: Array.isArray(tags) ? tags.filter((t) => t && t.trim()) : [],
    };

    user.markModified("onboardingProfile");
    await user.save();

    return res.json({
      success: true,
      message: "Career goal updated successfully.",
      careerGoal: {
        role: user.onboardingProfile.careerGoal,
        tags: user.onboardingProfile.careerGoalTags || [],
      },
    });
  } catch (err) {
    console.error("[Dashboard] Error updating career goal:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update career goal. Please try again.",
    });
  }
}
