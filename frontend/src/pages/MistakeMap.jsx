import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Section from "../components/Section";
import Container from "../components/Container";
import SectionHeading from "../components/SectionHeading";
import Card from "../components/Card";
import Button from "../components/Button";
import HeroSection from "../components/HeroSection";
import { mistakeMapApi } from "../services/api";

const HOW_IT_WORKS = [
  {
    title: "1. Attempt Assessments",
    description:
      "Practice diagnostic assessments across your topics. Every response and time interval is logged.",
  },
  {
    title: "2. Concept Telemetry & Classification",
    description:
      "Every answer is mapped to its core concept, topic, difficulty, and deterministic mistake category.",
  },
  {
    title: "3. Multi-Attempt Pattern Mapping",
    description:
      "Telemetry aggregates across assessments to detect recurring weaknesses, trend direction, and AI priorities.",
  },
];

const FEATURES = [
  {
    eyebrow: "Concept-Level",
    title: "Root Skill Tracing",
    description:
      "Moves beyond question-level review to identify recurring concept bottlenecks across tests.",
  },
  {
    eyebrow: "Categorization",
    title: "Evidence-Based Classification",
    description:
      "Distinguishes conceptual gaps from careless calculation slips, implementation syntax errors, or logical missteps.",
  },
  {
    eyebrow: "Dynamic Priority",
    title: "Actionable Learning Ranks",
    description:
      "Dynamically groups skills into High Priority, Needs Practice, and Mastered so you know exactly what to study next.",
  },
];

const COMPARISON = [
  {
    without: "Re-take entire tests hoping mistakes don't recur",
    withMap: "Target the exact recurring concept weakness causing score loss",
  },
  {
    without: "Wrong answers are just marked red with no deeper pattern",
    withMap: "Classified into Conceptual, Logical, Implementation, or Careless errors",
  },
  {
    without: "Guess whether you are improving over time",
    withMap: "Before vs Now progress tracking highlights improving vs regressing concepts",
  },
  {
    without: "Equal time wasted revising already-mastered concepts",
    withMap: "Dynamic priority flags High Priority gaps vs Lower Priority mastered skills",
  },
];

// Chart colors
const CHART_COLOR_BEFORE = "#9CA3AF";
const CHART_COLOR_PRIMARY = "#14776e";
const CHART_COLOR_ATTENTION = "#f59e0b";
const CHART_COLOR_HIGH = "#ef4444";

const MISTAKE_TYPE_BADGES = {
  CONCEPTUAL: { label: "Conceptual Gap", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  LOGICAL: { label: "Logical Reasoning", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  IMPLEMENTATION: { label: "Implementation", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  CARELESS: { label: "Careless / Slip", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  MISINTERPRETATION: { label: "Misinterpretation", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  TIME_MANAGEMENT: { label: "Time Management", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  UNKNOWN: { label: "General Error", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

const KNOWN_SHORT_LABELS = {
  // Pharmacy, Pharmacology & Healthcare
  "Pharmacokinetic & Dynamic Studies": "PK Studies",
  "Pharmacokinetics & Pharmacodynamics": "PK / PD",
  "Pharmacokinetics": "PK Studies",
  "Pharmacodynamics": "PD Studies",
  "Pharmacology": "Pharmacology",
  "Pharmacy Quality & Drug Interactions": "Pharmacy",
  "Pharmacy Practice & Clinical Guidelines": "Pharmacy",
  "Testing Parameters & Assay Validation": "Testing Parameters",
  "Testing Parameters": "Testing Parameters",
  "Adverse Drug Reactions & Monitoring": "Drug Interactions",
  "Adverse Drug Reactions": "Drug Reactions",
  "Drug Interactions & Contraindications": "Drug Interactions",
  "Clinical Pharmacology & Dosing Guidelines": "Clinical Dosing",
  "Biochemical Pathways & Enzymology": "Biochem Pathways",
  "Toxicology & Risk Assessment": "Toxicology",
  "Pharmaceutical Formulations": "Formulations",

  // Tech, Computer Science & Algorithms
  "Dynamic Programming & Memoization": "Dynamic Prog.",
  "Object Oriented Programming": "OOP Principles",
  "Data Structures & Algorithms": "Data Structures",
  "Binary Search & Divide and Conquer": "Binary Search",
  "Graph Traversal & Shortest Path": "Graph Traversal",
  "Relational Database Management": "RDBMS / SQL",
  "Continuous Integration & Deployment": "CI / CD",
  "System Architecture & Scalability": "System Arch",
  "Operating Systems & Concurrency": "Operating Systems",
  "Computer Networks & Protocols": "Networks",
  "Machine Learning & Neural Networks": "Machine Learning",
};

/**
 * Produces clean, readable short labels for charts while preserving the full name in data for tooltips.
 */
function formatShortLabel(name, maxLen = 18) {
  if (!name) return "";
  const trimmed = String(name).trim();
  if (KNOWN_SHORT_LABELS[trimmed]) {
    return KNOWN_SHORT_LABELS[trimmed];
  }

  // Handle common word replacements
  let short = trimmed
    .replace(/pharmacokinetics?/gi, "PK")
    .replace(/pharmacodynamics?/gi, "PD")
    .replace(/parameters?/gi, "Params")
    .replace(/administration/gi, "Admin")
    .replace(/specifications?/gi, "Specs")
    .replace(/management/gi, "Mgmt")
    .replace(/development/gi, "Dev")
    .replace(/architecture/gi, "Arch")
    .replace(/optimization/gi, "Opt.")
    .replace(/configuration/gi, "Config")
    .replace(/information/gi, "Info");

  if (KNOWN_SHORT_LABELS[short]) {
    return KNOWN_SHORT_LABELS[short];
  }

  // If there's an ' & ' or ' / ' or ' - ', check if the first part is substantive and within limits
  if (short.length > maxLen) {
    if (short.includes(" & ")) {
      const parts = short.split(" & ");
      if (parts[0].length >= 3 && parts[0].length <= maxLen) {
        return parts[0].trim();
      }
    } else if (short.includes(" / ")) {
      const parts = short.split(" / ");
      if (parts[0].length >= 3 && parts[0].length <= maxLen) {
        return parts[0].trim();
      }
    } else if (short.includes(" - ")) {
      const parts = short.split(" - ");
      if (parts[0].length >= 3 && parts[0].length <= maxLen) {
        return parts[0].trim();
      }
    }
  }

  if (short.length > maxLen) {
    return short.slice(0, maxLen - 1).trim() + "…";
  }
  return short;
}

function ProgressTooltip({ active, payload, label, data = [] }) {
  if (!active || !payload || !payload.length) return null;
  const row = data.find((t) => t.concept === label || t.shortLabel === label);
  const fullTitle = row?.concept || label;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-3.5 shadow-xl max-w-xs z-50">
      <p className="mb-1 text-xs font-bold text-[var(--color-text-h)] leading-snug">{fullTitle}</p>
      {row?.topic && (
        <p className="mb-2 text-[11px] font-medium text-[var(--color-text-muted)]">
          Topic: <span className="text-[var(--color-text-body)]">{row.topic}</span>
        </p>
      )}
      <div className="space-y-1.5 border-t border-[var(--color-border)] pt-2">
        {payload.map((p) => (
          <p key={p.dataKey} className="text-xs text-[var(--color-text-muted)] flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span>{p.name}:</span>
            </span>
            <span className="font-bold text-[var(--color-text-h)]">{p.value}</span>
          </p>
        ))}
      </div>
      {row?.needsAttention && (
        <p className="mt-2.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-2 py-1 flex items-center gap-1">
          <span>⚠</span> Needs review — recurring error pattern
        </p>
      )}
    </div>
  );
}

export default function MistakeMapPage() {
  const location = useLocation();
  const loadingRef = useRef(false);
  const refreshingAIRef = useRef(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAI, setRefreshingAI] = useState(false);
  const [error, setError] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("ALL");

  // Always open Mistake Map at the top upon fresh navigation
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    } else {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.pathname, location.key]);

  const loadData = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await mistakeMapApi.get();
      if (res && res.success && res.data) {
        setData(res.data);
      } else {
        setError(res?.message || "Failed to load Mistake Map telemetry.");
      }
    } catch (err) {
      console.error("Error loading Mistake Map:", err);
      setError("Unable to connect to the Mistake Map telemetry engine.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleRefreshAI = async () => {
    if (refreshingAIRef.current || refreshingAI) return;
    refreshingAIRef.current = true;
    setRefreshingAI(true);
    try {
      const res = await mistakeMapApi.getAIInsights();
      if (res && res.success && res.data) {
        setData((prev) => (prev ? { ...prev, aiInsights: res.data } : prev));
      }
    } catch (err) {
      console.error("Failed to refresh AI insights:", err);
    } finally {
      refreshingAIRef.current = false;
      setRefreshingAI(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hasData = Boolean(data?.hasData && data?.totalAttempts > 0);
  const summary = data?.summary || {};
  const concepts = Array.isArray(data?.concepts) ? data.concepts : [];
  const topics = Array.isArray(data?.topics) ? data.topics : [];
  const mistakeDistribution = data?.mistakeDistribution || { breakdown: [], totalMistakes: 0 };
  const topicProgress = Array.isArray(data?.trends?.topicProgress) ? data.trends.topicProgress : [];
  const trajectoryData = (topicProgress.slice(0, 8) || []).map((item) => ({
    ...item,
    shortLabel: formatShortLabel(item.concept || item.topic || "Unknown", 18),
  }));
  const aiInsights = data?.aiInsights || null;

  // Filtered concepts
  const filteredConcepts = concepts.filter((c) => {
    if (priorityFilter !== "ALL") {
      if (priorityFilter === "HIGH" && c.learningPriority !== "HIGH PRIORITY") return false;
      if (priorityFilter === "PRACTICE" && c.learningPriority !== "NEEDS PRACTICE") return false;
      if (priorityFilter === "STRONG" && c.learningPriority !== "LOWER PRIORITY / STRONG") return false;
    }
    if (selectedTopic !== "ALL" && c.topic !== selectedTopic) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.concept.toLowerCase().includes(q) ||
        c.topic.toLowerCase().includes(q) ||
        (c.evidence && c.evidence.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCF7]">
      {/* Hero Section */}
      <HeroSection
        variant="mistake-map"
        eyebrow="AI-Powered · Mistake Map"
        title="From every wrong answer to"
        highlightWord="actionable mastery"
        description="Mistake Map analyzes your performance across assessments at the concept and skill level — clustering recurring gaps, tracking error trajectories, and formulating AI-backed study priorities."
        primaryCta={{ label: "Practice Diagnostic Assessment", href: "/assessment" }}
        secondaryCta={{ label: "Explore Diagnostic Engine", href: "#diagnostics" }}
      />

      {/* Main Diagnostic Telemetry Dashboard */}
      <Section id="diagnostics" className="py-8 sm:py-12">
        <Container size="wide">
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-[var(--color-border)] bg-white p-12 shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-center gap-4">
                <span className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--color-primary-600)] border-t-transparent" />
                <div className="text-center">
                  <p className="text-base font-semibold text-[var(--color-text-h)]">
                    Loading Mistake Map Telemetry...
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Aggregating concept accuracy, detecting recurring weakness patterns & learning priorities
                  </p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50/50 p-8 text-center shadow-[var(--shadow-card)]">
              <p className="text-base font-semibold text-red-700">{error}</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[var(--color-primary-700)] transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          ) : !hasData ? (
            /* Empty State for New Users */
            <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--color-border)] bg-white p-10 text-center shadow-[var(--shadow-card)] sm:p-14">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="inline-flex rounded-full bg-[var(--color-primary-50)] px-3 py-1 text-xs font-bold text-[var(--color-primary-700)] uppercase tracking-wider mb-3">
                No Assessment Data Recorded
              </span>
              <h3 className="font-sans text-2xl font-bold text-[var(--color-text-h)]">
                Your Mistake Map Is Waiting to Activate
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)] max-w-lg mx-auto">
                Complete your first practice assessment or diagnostic test. As you answer questions, our diagnostic engine automatically tags concepts, calculates mistake patterns, and populates your personalized learning priority matrix.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button as="a" href="/assessment" size="lg" className="w-full sm:w-auto">
                  Take Benchmark Assessment
                </Button>
                <Button as="a" href="/dashboard" variant="outline" size="lg" className="w-full sm:w-auto">
                  View Learning Dashboard
                </Button>
              </div>
            </div>
          ) : (
            /* Active Telemetry Dashboard */
            <div className="space-y-8">
              {/* Telemetry Header Badge + Refresh Action */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text-h)]">
                      Active Telemetry · {summary.totalAttempts} Assessment{summary.totalAttempts > 1 ? "s" : ""} Analyzed
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {summary.totalQuestions} questions tracked across {concepts.length} concept areas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {summary.totalAttempts === 1 && (
                    <span className="hidden md:inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                      💡 Tip: Complete 1 more test to unlock multi-attempt trend tracking
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleRefreshAI}
                    disabled={refreshingAI}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface-secondary)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text-h)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)] transition-colors border border-[var(--color-border)] disabled:opacity-50"
                  >
                    <svg className={`h-3.5 w-3.5 ${refreshingAI ? "animate-spin text-[var(--color-primary-600)]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {refreshingAI ? "Synthesizing AI Insights..." : "Refresh AI Insights"}
                  </button>
                  <Button as="a" href="/assessment" size="sm">
                    New Assessment
                  </Button>
                </div>
              </div>

              {/* 4 Core Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <span>Overall Accuracy</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[var(--color-text-h)]">
                      {summary.overallAccuracy}%
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      ({summary.totalCorrect}/{summary.totalQuestions} correct)
                    </span>
                  </div>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--color-primary-600)] h-1.5 rounded-full"
                      style={{ width: `${summary.overallAccuracy}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <span>Mistakes Tracked</span>
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[var(--color-text-h)]">
                      {summary.totalMistakes}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      ({summary.mistakeRate}% error rate)
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                    Dominant: <span className="font-semibold text-[var(--color-text-h)]">{mistakeDistribution.dominantType?.replace(/_/g, " ")}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 shadow-[var(--shadow-card)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-red-700 uppercase tracking-wider">
                    <span>High Priority</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-[10px] font-bold text-red-700">Urgent</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-red-700">
                      {summary.highPriorityCount}
                    </span>
                    <span className="text-xs text-red-600">
                      concept{summary.highPriorityCount !== 1 ? "s" : ""} flagged
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-red-600 truncate">
                    Top: <span className="font-semibold">{summary.mostCommonWeakness}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-[var(--shadow-card)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    <span>Mastered / Strong</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700">Proficient</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-700">
                      {summary.strongCount}
                    </span>
                    <span className="text-xs text-emerald-600">
                      concept{summary.strongCount !== 1 ? "s" : ""} (≥75%)
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-emerald-600 truncate">
                    Top: <span className="font-semibold">{summary.strongestConcept || "None yet"}</span>
                  </p>
                </div>
              </div>

              {/* AI-Powered Personalized Learning Insights Card */}
              {aiInsights && (
                <div className="overflow-hidden rounded-3xl border border-[#2E4F42]/20 bg-[#1B332C] text-white shadow-xl">
                  <div className="border-b border-[#2E4F42] bg-[#142822] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8C547]/20 text-[#E8C547] text-sm">
                        ✦
                      </span>
                      <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-[#E8C547]">
                        AI Diagnostic Intelligence & Learning Strategy
                      </h3>
                    </div>
                    <span className="text-xs text-gray-300 font-medium">
                      Grounded in {summary.totalAttempts} Assessment Attempts
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Headline Diagnostic */}
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white leading-snug">
                        {aiInsights.summaryHeadline || "Personalized Diagnostic Insights"}
                      </h4>
                      {aiInsights.why && (
                        <p className="mt-2 text-sm leading-relaxed text-gray-300">
                          {aiInsights.why}
                        </p>
                      )}
                    </div>

                    {/* Focus More vs Lower Priority Chips */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-[#2E4F42]/40">
                      {/* Focus More */}
                      <div className="rounded-2xl bg-[#11231D]/80 p-5 border border-[#2E4F42]/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="h-2 w-2 rounded-full bg-red-400" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-red-300">
                            Focus More Next (Highest Impact)
                          </h5>
                        </div>
                        {aiInsights.focusMore && aiInsights.focusMore.length > 0 ? (
                          <div className="space-y-3">
                            {aiInsights.focusMore.map((item, idx) => (
                              <div key={idx} className="rounded-xl bg-[#1B332C] p-3.5 border border-[#2E4F42]/40">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-bold text-white">{item.concept}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.urgency === "HIGH" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-amber-500/20 text-amber-300"}`}>
                                    {item.urgency || "HIGH"} PRIORITY
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-300 leading-relaxed">{item.reason}</p>
                                {item.suggestedAction && (
                                  <p className="mt-2 text-xs font-semibold text-[#E8C547] flex items-center gap-1.5">
                                    <span>➔ Action:</span> {item.suggestedAction}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No urgent conceptual weaknesses detected.</p>
                        )}
                      </div>

                      {/* Lower Priority / Mastered */}
                      <div className="rounded-2xl bg-[#11231D]/80 p-5 border border-[#2E4F42]/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                            Lower Priority (Demonstrated Strength)
                          </h5>
                        </div>
                        {aiInsights.lowerPriority && aiInsights.lowerPriority.length > 0 ? (
                          <div className="space-y-3">
                            {aiInsights.lowerPriority.map((item, idx) => (
                              <div key={idx} className="rounded-xl bg-[#1B332C] p-3.5 border border-[#2E4F42]/40">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-bold text-white">{item.concept}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    MASTERED
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-300 leading-relaxed">{item.reason}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Complete more questions to demonstrate mastery across topics.</p>
                        )}
                      </div>
                    </div>

                    {/* Recommended Targeted Practice Steps */}
                    {aiInsights.recommendedPractice && aiInsights.recommendedPractice.length > 0 && (
                      <div className="rounded-2xl bg-[#142822] p-5 border border-[#2E4F42]/40">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[#E8C547] mb-3 flex items-center gap-2">
                          <span>🎯 Targeted Practice Recommendations</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {aiInsights.recommendedPractice.map((rec, idx) => (
                            <div key={idx} className="rounded-xl bg-[#1B332C] p-4 border border-[#2E4F42]/30 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-[var(--color-primary-200)] bg-[var(--color-primary-900)] px-2 py-0.5 rounded">
                                  {rec.topic}
                                </span>
                                <h6 className="mt-2 text-sm font-bold text-white">{rec.problemType || rec.concept}</h6>
                                <p className="mt-1 text-xs text-gray-300 leading-relaxed">{rec.practiceStrategy}</p>
                              </div>
                              <p className="mt-3 text-[11px] font-semibold text-emerald-300">
                                Goal: {rec.expectedOutcome}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Concept Priority Explorer */}
              <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-sans text-xl font-bold text-[var(--color-text-h)]">
                      Concept Mastery & Learning Priority Ranks
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Prioritized dynamically by failure frequency, recurrence across assessments, and accuracy gaps
                    </p>
                  </div>

                  {/* Priority Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "ALL", label: `All (${concepts.length})` },
                      { id: "HIGH", label: `High Priority (${summary.highPriorityCount || 0})` },
                      { id: "PRACTICE", label: `Needs Practice (${summary.needsPracticeCount || 0})` },
                      { id: "STRONG", label: `Strong (${summary.strongCount || 0})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPriorityFilter(tab.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          priorityFilter === tab.id
                            ? "bg-[var(--color-primary-600)] text-white shadow"
                            : "bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-h)]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter / Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search concepts or topics (e.g. Hashing, Arrays, SQL)..."
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-2 text-xs font-medium text-[var(--color-text-h)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] transition-all"
                    />
                  </div>
                  <div>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-2 text-xs font-medium text-[var(--color-text-h)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] transition-all"
                    >
                      <option value="ALL">All Topics ({topics.length})</option>
                      {topics.map((t) => (
                        <option key={t.topic} value={t.topic}>
                          {t.topic} ({t.totalQuestions} Qs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Concept Cards Grid */}
                {filteredConcepts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredConcepts.map((item) => {
                      const isHigh = item.learningPriority === "HIGH PRIORITY";
                      const isStrong = item.learningPriority === "LOWER PRIORITY / STRONG";
                      const badgeInfo = MISTAKE_TYPE_BADGES[item.primaryMistakeType] || MISTAKE_TYPE_BADGES.UNKNOWN;

                      return (
                        <div
                          key={item.concept}
                          className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                            isHigh
                              ? "border-red-200 bg-red-50/20 hover:border-red-300"
                              : isStrong
                              ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
                              : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-300)]"
                          }`}
                        >
                          <div>
                            {/* Header Tags */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded">
                                {item.topic}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isHigh
                                    ? "bg-red-100 text-red-700"
                                    : isStrong
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {item.learningPriority}
                              </span>
                            </div>

                            {/* Concept Name */}
                            <h4 className="font-sans text-base font-bold text-[var(--color-text-h)]">
                              {item.concept}
                            </h4>

                            {/* Accuracy Gauge */}
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-[var(--color-text-muted)]">Accuracy</span>
                                <span className={isHigh ? "text-red-600" : isStrong ? "text-emerald-600" : "text-amber-600"}>
                                  {item.accuracy}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${
                                    isHigh ? "bg-red-500" : isStrong ? "bg-emerald-500" : "bg-amber-500"
                                  }`}
                                  style={{ width: `${item.accuracy}%` }}
                                />
                              </div>
                            </div>

                            {/* Telemetry Stats */}
                            <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)] py-2 border-y border-[var(--color-border)]/60">
                              <span>
                                Attempts: <strong className="text-[var(--color-text-h)]">{item.totalAttempts}</strong>
                              </span>
                              <span>
                                Mistakes: <strong className={item.mistakeCount > 0 ? "text-red-600" : "text-emerald-600"}>{item.mistakeCount}</strong>
                              </span>
                              <span>
                                Score: <strong className="text-[var(--color-text-h)]">{item.priorityScore}</strong>
                              </span>
                            </div>

                            {/* Recurring / Mistake Type Chips */}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {item.isRecurringWeakness && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
                                  🚨 Recurring Weakness
                                </span>
                              )}
                              {item.mistakeCount > 0 && item.primaryMistakeType !== "NONE" && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeInfo.bg} ${badgeInfo.text} ${badgeInfo.border}`}>
                                  {badgeInfo.label}
                                </span>
                              )}
                              {item.trend === "improving" && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ↗ Improving
                                </span>
                              )}
                              {item.trend === "regressing" && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                  ↘ Regressing
                                </span>
                              )}
                            </div>

                            {/* Evidence Summary */}
                            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                              {item.evidence}
                            </p>
                          </div>

                          <div className="mt-4 pt-3">
                            <Link
                              to="/assessment"
                              title={`Practice ${item.concept}`}
                              className="flex h-9 w-full min-w-0 items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] px-3 text-xs font-bold text-[var(--color-text-h)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)] transition-colors border border-[var(--color-border)] text-center"
                            >
                              <span className="truncate block max-w-full">
                                Practice {item.concept}
                              </span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--color-border)] p-8 text-center bg-gray-50/50">
                    <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                      No concepts match the selected filter.
                    </p>
                  </div>
                )}
              </div>

              {/* Visual Analytics Grid: Mistake Distribution + Before vs Now Trajectory Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
                {/* Before vs Now Progress Trajectory */}
                <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
                  <div className="mb-4">
                    <h3 className="font-sans text-lg font-bold text-[var(--color-text-h)]">
                      Error Trajectory · Before vs. Recent Attempts
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Compares mistakes in earlier assessments (Before) with recent assessments (Now)
                    </p>
                  </div>

                  {trajectoryData.length > 0 ? (
                    <>
                      <div className="w-full">
                        <ResponsiveContainer
                          width="100%"
                          height={Math.max(280, trajectoryData.length * 42 + 65)}
                        >
                          <BarChart
                            layout="vertical"
                            data={trajectoryData}
                            margin={{ top: 10, right: 25, left: 10, bottom: 20 }}
                            barGap={4}
                            barCategoryGap="24%"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis
                              type="number"
                              allowDecimals={false}
                              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                              axisLine={{ stroke: "var(--color-border)" }}
                              tickLine={false}
                              domain={[0, (dataMax) => Math.max(3, dataMax + 1)]}
                              label={{
                                value: "Mistake Count",
                                position: "insideBottom",
                                offset: -12,
                                fill: "var(--color-text-muted)",
                                fontSize: 11,
                              }}
                            />
                            <YAxis
                              type="category"
                              dataKey="shortLabel"
                              width={130}
                              tick={{ fill: "var(--color-text-h)", fontSize: 11, fontWeight: 500 }}
                              axisLine={{ stroke: "var(--color-border)" }}
                              tickLine={false}
                            />
                            <Tooltip
                              content={<ProgressTooltip data={trajectoryData} />}
                              cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                            />
                            <Legend
                              verticalAlign="top"
                              align="right"
                              wrapperStyle={{ paddingBottom: 14, fontSize: 12, color: "var(--color-text-muted)" }}
                            />
                            <Bar
                              dataKey="before"
                              name="Earlier Mistakes"
                              fill={CHART_COLOR_BEFORE}
                              radius={[0, 4, 4, 0]}
                              barSize={11}
                            />
                            <Bar
                              dataKey="after"
                              name="Recent Mistakes"
                              fill={CHART_COLOR_PRIMARY}
                              radius={[0, 4, 4, 0]}
                              barSize={11}
                            >
                              {trajectoryData.map((entry) => (
                                <Cell
                                  key={entry.concept}
                                  fill={entry.needsAttention ? CHART_COLOR_ATTENTION : CHART_COLOR_PRIMARY}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-3">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary-600)]" />
                          Improved / Stabilized
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                          Needs Attention / Persistent
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-xs text-[var(--color-text-muted)]">
                      Complete more assessments to generate longitudinal before/now error trajectory curves.
                    </div>
                  )}
                </div>

                {/* Mistake Categories Breakdown */}
                <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] space-y-4">
                  <div>
                    <h3 className="font-sans text-lg font-bold text-[var(--color-text-h)]">
                      Mistake Type Breakdown
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Deterministic classification of your {summary.totalMistakes} errors
                    </p>
                  </div>

                  <div className="space-y-3">
                    {mistakeDistribution.breakdown.map((item) => {
                      const badge = MISTAKE_TYPE_BADGES[item.type] || MISTAKE_TYPE_BADGES.UNKNOWN;
                      return (
                        <div key={item.type} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[var(--color-text-h)] flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${item.count > 0 ? "bg-[var(--color-primary-600)]" : "bg-gray-300"}`} />
                              {item.label}
                            </span>
                            <span className="font-bold text-[var(--color-text-h)]">
                              {item.count} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[var(--color-primary-600)] h-2 rounded-full transition-all"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl bg-[var(--color-surface-secondary)] p-4 border border-[var(--color-border)] mt-4">
                    <h5 className="text-xs font-bold text-[var(--color-text-h)] mb-1">
                      Why Classification Matters
                    </h5>
                    <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                      Conceptual gaps require theoretical review, whereas careless errors require calculation checks and logical errors require algorithmic dry-runs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" className="border-t border-[var(--color-border)]">
        <SectionHeading
          title="From wrong answer to clear fix, automatically"
          subtitle="No manual tagging. Real data telemetry and AI diagnostic synthesis keep your map accurate."
        />
        <div className="relative mt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center gap-3 text-center"
              >
                <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-base font-semibold text-white ring-4 ring-[var(--color-primary-50)]">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-[var(--color-text-h)]">
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section>
        <SectionHeading
          title="Built to find the real gap, not just mark errors"
          subtitle="Three core capabilities of the upgraded Mistake Map diagnostic engine."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} eyebrow={feature.eyebrow} title={feature.title}>
              {feature.description}
            </Card>
          ))}
        </div>
      </Section>

      {/* Comparison: Without vs With */}
      <Section>
        <SectionHeading
          title="What changes with a Data-Driven Mistake Map"
          subtitle="Same assessment data — structured into concept-level mastery and actionable learning priorities."
        />
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2">
            <div className="border-b border-r border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-5 py-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
              Without Mistake Map
            </div>
            <div className="border-b border-[var(--color-border)] bg-[var(--color-primary-50)] px-5 py-4 text-center text-sm font-semibold text-[var(--color-primary-700)]">
              With Data-Driven Mistake Map
            </div>
          </div>
          {COMPARISON.map((row, index) => (
            <div key={index} className="grid grid-cols-2">
              <div
                className={`flex items-start gap-2 border-r border-[var(--color-border)] px-5 py-4 text-sm leading-relaxed text-[var(--color-text-muted)] ${
                  index !== COMPARISON.length - 1 ? "border-b border-[var(--color-border)]" : ""
                }`}
              >
                <span className="mt-0.5 shrink-0 text-red-500 font-bold">✕</span>
                {row.without}
              </div>
              <div
                className={`flex items-start gap-2 bg-[var(--color-primary-50)]/30 px-5 py-4 text-sm leading-relaxed text-[var(--color-text-body)] ${
                  index !== COMPARISON.length - 1 ? "border-b border-[var(--color-border)]" : ""
                }`}
              >
                <span className="mt-0.5 shrink-0 text-[var(--color-primary-600)] font-bold">✓</span>
                {row.withMap}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Bottom CTA */}
      <Section className="py-8 sm:py-10 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 rounded-2xl border border-[var(--color-primary-800)] bg-[var(--color-navy)] px-6 py-6 sm:px-8 sm:py-6 shadow-md">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Ready to improve?
            </h3>
            <p className="text-xs sm:text-sm text-[#FBF8F0]/80 leading-relaxed max-w-xl">
              Take another assessment to identify your latest weak areas.
            </p>
          </div>

          <Link
            to="/assessment"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D9A62B] hover:bg-[#E8C547] text-[#1B332C] px-5 py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow shrink-0 whitespace-nowrap"
          >
            <span>Start Assessment</span>
            <span>→</span>
          </Link>
        </div>
      </Section>
    </div>
  );
}
