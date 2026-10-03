import React, { useState, useEffect, useCallback } from "react";
import Container from "../components/Container";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatCard from "../components/dashboard/StatCard";
import LearningProgressChart from "../components/dashboard/LearningProgressChart";
import AIInsightCard from "../components/dashboard/AIInsightCard";
import CognifyModules from "../components/dashboard/CognifyModules";
import RoadmapSection from "../components/dashboard/RoadmapSection";
import RecentAssessmentsTable from "../components/dashboard/RecentAssessmentsTable";
import NextStepsCard from "../components/dashboard/NextStepsCard";
import ProfileSettingsCard from "../components/dashboard/ProfileSettingsCard";
import ProfileEditModal from "../components/dashboard/ProfileEditModal";
import FloatingAIAssistant from "../components/FloatingAIAssistant";
import AchievementBadges from "../components/dashboard/AchievementBadges";
import { BADGE_DEFINITIONS, computeAchievementStats } from "../components/dashboard/achievementData";
import { Link } from "react-router-dom";
import { dashboardApi, assessmentApi } from "../services/api";

// ─────────────────────────────────────────────────────────────────
// Sidebar nav config — `id` must match the section key rendered below.
// Add or remove a dashboard section by editing this list only.
// ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "recommended",
    label: "Recommended",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: "modules",
    label: "AI Modules",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: "assessments",
    label: "Assessments",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "next-steps",
    label: "Next Steps",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────
// Sidebar — desktop: sticky panel in document flow (never overlaps
// Navbar or Footer). Mobile: horizontal pill bar at the top.
// ─────────────────────────────────────────────────────────────────
function DashboardSidebar({ active, onSelect, user }) {
  return (
    <>
      {/* Desktop sidebar — sticky, stays in document flow */}
      <aside className="hidden lg:flex lg:flex-col shrink-0 w-72 bg-[#1B332C] border-r border-[#C4952A]/25 sticky top-[65px] self-start h-[calc(100vh-65px)] overflow-y-auto">
        {/* Brand */}
        <div className="px-6 py-7 border-b border-[#FBF8F0]/10">
          <h1 className="font-sans text-2xl font-bold text-[#E8C547] tracking-tight">
            AIFinity
          </h1>
          <p className="mt-1 text-xs text-[#FBF8F0]/55">Learning Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#E8C547] text-[#1B332C]"
                    : "text-[#FBF8F0]/75 hover:bg-[#2E4F42] hover:text-[#FBF8F0]"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div className="px-4 py-5 border-t border-[#FBF8F0]/10">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[#2E4F42]/60">
            <div className="w-9 h-9 shrink-0 rounded-full bg-[#E8C547] text-[#1B332C] font-bold flex items-center justify-center text-sm">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#FBF8F0] truncate">
                {user?.name || "Learner"}
              </p>
              <p className="text-xs text-[#FBF8F0]/55 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden sticky top-[65px] z-30 bg-[#1B332C] border-b border-[#C4952A]/25">
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#E8C547] text-[#1B332C]"
                    : "bg-[#2E4F42] text-[#FBF8F0]/80"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Loading Skeleton — shown while the dashboard API call is in flight.
// Mirrors the sidebar + panel layout so there's no jump after load.
// ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Top indicator banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EDE6D3]/60 border border-[#2E4F42]/12 text-[#1B332C]">
        <div className="h-4 w-4 rounded-full border-2 border-[#1B332C] border-t-transparent animate-spin shrink-0" />
        <span className="text-xs font-semibold text-[#1B332C]">
          Loading your learning stats, badges, and progress...
        </span>
      </div>

      {/* Header skeleton */}
      <div className="rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/12 p-6 sm:p-8 shadow-[var(--shadow-card)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="h-4 w-28 rounded-md bg-[#2E4F42]/15" />
          <div className="h-8 w-64 rounded-md bg-[#2E4F42]/20" />
          <div className="h-4 w-80 rounded-md bg-[#2E4F42]/10" />
        </div>
        <div className="h-10 w-24 rounded-xl bg-[#2E4F42]/15 shrink-0" />
      </div>

      {/* 4 Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/12 p-6 h-36 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded-md bg-[#2E4F42]/15" />
              <div className="h-9 w-9 rounded-xl bg-[#EDE6D3] border border-[#2E4F42]/10" />
            </div>
            <div className="h-8 w-24 rounded-md bg-[#2E4F42]/25 my-2" />
            <div className="h-3 w-32 rounded-md bg-[#2E4F42]/10" />
          </div>
        ))}
      </div>

      {/* Chart + AI insight card skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/12 p-6 h-80 shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="h-5 w-44 rounded-md bg-[#2E4F42]/20" />
              <div className="h-3 w-64 rounded-md bg-[#2E4F42]/10" />
            </div>
            <div className="h-7 w-28 rounded-lg bg-[#2E4F42]/10" />
          </div>
          <div className="h-44 w-full rounded-xl bg-[#EDE6D3]/40 border border-[#2E4F42]/10 flex items-end p-4 gap-4 justify-around">
            {[40, 65, 50, 80, 55, 70, 90].map((h, idx) => (
              <div
                key={idx}
                className="w-8 rounded-t-md bg-[#2E4F42]/15"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 rounded-2xl bg-[#1B332C] border border-[#C4952A]/30 p-6 sm:p-8 h-80 shadow-[var(--shadow-card)] flex flex-col justify-between text-[#FBF8F0]">
          <div className="flex flex-col gap-3">
            <div className="h-5 w-32 rounded-md bg-[#C4952A]/30" />
            <div className="h-6 w-full rounded-md bg-[#FBF8F0]/20" />
            <div className="h-4 w-3/4 rounded-md bg-[#FBF8F0]/15" />
          </div>
          <div className="h-20 w-full rounded-xl bg-[#2E4F42]/60 border border-[#C4952A]/20 p-3" />
          <div className="h-8 w-28 rounded-xl bg-[#E8C547]/40 self-end" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Error State — shown if the dashboard API returns an error.
// ─────────────────────────────────────────────────────────────────
function DashboardError({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
      <div className="rounded-2xl bg-[#FBF8F0] border border-[#C1443C]/30 p-8 text-center max-w-md shadow-[var(--shadow-card)]">
        <span className="text-4xl">⚠️</span>
        <h2 className="mt-4 font-sans text-2xl font-bold text-[#1B332C]">
          Unable to load your dashboard.
        </h2>
        <p className="mt-2 text-sm text-[#5B6B5F]">
          Something went wrong while fetching your data. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-5 py-2.5 text-sm font-semibold text-[#E8C547] border border-[#C4952A]/40 hover:bg-[#2E4F42] transition-colors cursor-pointer"
        >
          Try Again →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty Progress Chart — shown when user has no assessments yet.
// ─────────────────────────────────────────────────────────────────
function EmptyProgressChart() {
  return (
    <div className="rounded-2xl bg-[#FBF8F0] p-6 border border-[#2E4F42]/12 shadow-[var(--shadow-card)] flex flex-col gap-4">
      <div>
        <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#1B332C]">
          YOUR LEARNING PROGRESS
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6B5F] font-normal mt-0.5">
          Accuracy &amp; performance evolution over time
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-[#F1EDE1]/50 border border-[#2E4F42]/10 p-10 gap-3 min-h-[200px]">
        <span className="text-4xl">📊</span>
        <p className="font-sans text-lg font-bold text-[#1B332C] text-center">
          No assessment history yet.
        </p>
        <p className="text-sm text-[#5B6B5F] text-center max-w-xs">
          Complete your first assessment to start tracking your learning progress here.
        </p>
        <Link
          to="/assessment"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-4 py-2 text-sm font-semibold text-[#E8C547] border border-[#C4952A]/40 hover:bg-[#2E4F42] transition-colors"
        >
          Browse Assessments →
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MiniAchievementsBanner — compact earned-badge preview on Overview
// ─────────────────────────────────────────────────────────────────

function MiniAchievementsBanner({ dashData, onViewAll }) {
  const stats = computeAchievementStats(dashData);
  if (!stats) return null;

  const earnedBadges = BADGE_DEFINITIONS.filter((b) => b.condition(stats));
  const totalXP = earnedBadges.reduce((sum, b) => sum + b.xp, 0);
  const recentBadges = earnedBadges.slice(0, 5);

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      style={{ background: "linear-gradient(135deg, #1B332C 0%, #2E4F42 100%)", borderColor: "rgba(196,149,42,0.3)" }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-2xl shrink-0">🏆</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E8C547]/70 mb-0.5">
            Your Achievements
          </p>
          <p className="text-sm font-bold text-[#FBF8F0]">
            {earnedBadges.length > 0
              ? `${earnedBadges.length} badge${earnedBadges.length > 1 ? "s" : ""} earned · ${totalXP.toLocaleString()} XP`
              : "No badges yet — start earning!"}
          </p>
        </div>
      </div>

      {/* Badge icons preview */}
      {recentBadges.length > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          {recentBadges.map((badge) => (
            <div
              key={badge.id}
              title={`${badge.name} (${badge.tagline})`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-base border shadow-xs transition-transform hover:scale-110 cursor-pointer"
              style={{ background: badge.bg, borderColor: badge.border }}
            >
              <span className="leading-none select-none">{badge.emoji || badge.icon || "🏅"}</span>
            </div>
          ))}
          {earnedBadges.length > 5 && (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border shadow-xs"
              style={{ background: "rgba(232,197,71,0.15)", borderColor: "rgba(232,197,71,0.4)", color: "#E8C547" }}
            >
              +{earnedBadges.length - 5}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onViewAll}
        className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer hover:opacity-90"
        style={{ background: "#E8C547", color: "#1B332C" }}
      >
        View All →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Dashboard — main page component
// ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.get();
      const personalizedRes = await assessmentApi.getPersonalized();

      if (res.success && res.data) {
        setDashData(res.data);
      } else {
        setError(res.error || "Failed to load dashboard data.");
      }

      if (personalizedRes.success) {
        setRecommended(personalizedRes.assessments || []);
      }
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /**
   * Persists the updated career goal to the backend, then re-fetches
   * the dashboard so all components reflect the new goal immediately.
   */
  const handleUpdateGoal = async (updatedGoal) => {
    if (!updatedGoal?.role) return;
    try {
      const res = await dashboardApi.updateCareerGoal({
        role: updatedGoal.role,
        tags: updatedGoal.tags || [],
      });
      if (res.success) {
        await fetchDashboard();
      }
    } catch (err) {
      console.error("[Dashboard] Career goal update failed:", err);
    }
  };

  // ── Loading state
  if (loading) {
    return (
      <div className="flex">
        <DashboardSidebar active={activeSection} onSelect={setActiveSection} user={null} />
        <div className="flex-1 py-6 sm:py-10">
          <Container size="wide">
            <DashboardSkeleton />
          </Container>
        </div>
      </div>
    );
  }

  // ── Error state
  if (error || !dashData) {
    return (
      <div className="flex">
        <DashboardSidebar active={activeSection} onSelect={setActiveSection} user={null} />
        <div className="flex-1 py-6 sm:py-10">
          <Container size="wide">
            <DashboardError onRetry={fetchDashboard} />
          </Container>
        </div>
      </div>
    );
  }

  const {
    user,
    stats,
    progressSeries,
    aiInsight,
    conceptRoot,
    mistakeMap,
    skillGap,
    roadmap,
    assessments,
    recommendations,
    careerGoal,
  } = dashData;

  const hasAssessmentHistory =
    progressSeries &&
    (progressSeries["7D"]?.length > 0 ||
      progressSeries["30D"]?.length > 0 ||
      progressSeries["3M"]?.length > 0);

  return (
    <div className="flex">
      <DashboardSidebar
        active={activeSection}
        onSelect={setActiveSection}
        user={user}
      />

      <div className="flex-1 min-w-0">
        <div className="py-6 sm:py-10">
          <Container size="wide">
            {/* HEADER — always visible, regardless of active section */}
            <div className="mb-8">
              <DashboardHeader
                user={user}
                quotes={[]}
                onOpenProfile={() => setIsProfileModalOpen(true)}
              />
            </div>

            {/* MAIN PANEL — only the active section renders */}
            <div className="flex flex-col gap-8">
              {/* ── OVERVIEW: stat cards + progress chart + AI insight */}
              {activeSection === "overview" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      href="/dashboard/progress"
                      label={stats.overallProgress.label}
                      value={stats.overallProgress.value}
                      unit={stats.overallProgress.unit}
                      change={stats.overallProgress.change}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      }
                    />
                    <StatCard
                      href="/dashboard/assessments"
                      label={stats.assessments.label}
                      value={stats.assessments.value}
                      unit={stats.assessments.unit}
                      change={stats.assessments.change}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      }
                    />
                    <StatCard
                      href="/dashboard/streak"
                      label={stats.learningStreak.label}
                      value={stats.learningStreak.value}
                      unit={stats.learningStreak.unit}
                      change={stats.learningStreak.change}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                      }
                    />
                    <StatCard
                      href="/dashboard/skills"
                      label={stats.skillsImproved.label}
                      value={stats.skillsImproved.value}
                      unit={stats.skillsImproved.unit}
                      change={stats.skillsImproved.change}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                      {hasAssessmentHistory ? (
                        <LearningProgressChart seriesData={progressSeries} />
                      ) : (
                        <EmptyProgressChart />
                      )}
                    </div>
                    <div className="lg:col-span-1 h-full">
                      <AIInsightCard aiInsight={aiInsight} />
                    </div>
                  </div>

                  {/* ── Mini Achievements Banner */}
                  <MiniAchievementsBanner
                    dashData={dashData}
                    onViewAll={() => setActiveSection("achievements")}
                  />
                </>
              )}

              {/* ── RECOMMENDED: AI-picked assessments */}
              {activeSection === "recommended" && (
                <div className="flex flex-col gap-6">
                  <h2 className="font-sans text-2xl font-bold text-[#1B332C]">
                    Recommended for You
                  </h2>
                  {recommended && recommended.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommended.slice(0, 3).map((assessment) => (
                        <div
                          key={assessment.id}
                          className="flex flex-col rounded-2xl bg-[#FBF8F0] p-6 border border-[#2E4F42]/12 shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-semibold uppercase text-[var(--color-primary-600)] bg-[var(--color-primary-50)] px-2 py-1 rounded-md">
                              {assessment.category}
                            </span>
                            <span className="text-xs font-medium text-[var(--color-text-muted)]">
                              {assessment.difficulty}
                            </span>
                          </div>
                          <h3 className="font-sans text-lg font-bold text-[#1B332C] mb-2">
                            {assessment.title}
                          </h3>
                          <p className="text-sm text-[var(--color-text-muted)] mb-4 flex-1">
                            {assessment.description}
                          </p>

                          {assessment.recommendationReason && (
                            <div className="text-xs font-medium text-[#C4952A] bg-[#EDE6D3] p-2 rounded-lg mb-4">
                              💡 {assessment.recommendationReason}
                            </div>
                          )}

                          <Link
                            to={`/assessment/${assessment.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B332C] px-4 py-2.5 text-sm font-semibold text-[#E8C547] hover:bg-[#2E4F42] transition-colors w-full"
                          >
                            Start Assessment
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#5B6B5F]">
                      No recommendations yet — complete an assessment to get personalized picks.
                    </p>
                  )}
                </div>
              )}

              {/* ── AI MODULES: ConceptRoot, MistakeMap, SkillGap */}
              {activeSection === "modules" && (
                <CognifyModules
                  conceptRoot={conceptRoot}
                  mistakeMap={mistakeMap}
                  skillGap={skillGap}
                />
              )}

              {/* ── ROADMAP */}
              {activeSection === "roadmap" && <RoadmapSection roadmap={roadmap} />}

              {/* ── ASSESSMENTS */}
              {activeSection === "assessments" && (
                <RecentAssessmentsTable assessments={assessments} />
              )}

              {/* ── ACHIEVEMENTS: Badges & Certificates */}
              {activeSection === "achievements" && (
                <AchievementBadges dashData={dashData} userName={user?.name} />
              )}

              {/* ── NEXT STEPS: Personal Intelligence + recommendations + career goal */}
              {activeSection === "next-steps" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="rounded-md bg-[#1B332C] p-6 sm:p-8 shadow-[var(--shadow-card)] text-[#FBF8F0] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4952A] rounded-full mix-blend-multiply filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                          <h3 className="font-sans text-2xl font-bold text-[#E8C547] flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Personal Intelligence
                          </h3>
                          <p className="mt-2 text-sm text-[#FBF8F0]/80 max-w-md">
                            Your AI-powered learning companion. Get personalized advice, ask
                            questions about your mistakes, and plan your next steps based on your
                            actual performance data.
                          </p>
                        </div>
                        <Link
                          to="/personal-intelligence"
                          className="shrink-0 inline-flex items-center gap-2 rounded-md bg-[#E8C547] px-6 py-3 text-sm font-bold text-[#1B332C] hover:bg-[#C4952A] hover:text-white transition-all shadow-md hover:shadow-lg"
                        >
                          Talk to AI →
                        </Link>
                      </div>
                    </div>

                    <NextStepsCard recommendations={recommendations} />
                  </div>
                  <div className="lg:col-span-1">
                    <ProfileSettingsCard
                      careerGoal={careerGoal}
                      onUpdateGoal={handleUpdateGoal}
                    />
                  </div>
                </div>
              )}
            </div>
          </Container>
        </div>
      </div>

      <FloatingAIAssistant />
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        careerGoal={careerGoal}
        onUpdateGoal={handleUpdateGoal}
      />
    </div>
  );
}