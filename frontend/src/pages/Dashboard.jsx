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
import { Link } from "react-router-dom";
import { dashboardApi, assessmentApi } from "../services/api";

// ─────────────────────────────────────────────────────────────────
// Loading Skeleton — shown while the dashboard API call is in flight.
// Preserves the layout so there's no content jump after data loads.
// ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-8 h-36" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-6 h-32" />
        ))}
      </div>

      {/* Chart + insight skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-6 h-72" />
        <div className="lg:col-span-1 rounded-2xl bg-[#1B332C]/80 border border-[#C4952A]/20 p-6 h-72" />
      </div>

      {/* Modules skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-6 h-64" />
        ))}
      </div>

      {/* Roadmap skeleton */}
      <div className="rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-8 h-52" />

      {/* Assessments table skeleton */}
      <div className="rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-8 h-48" />

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-6 h-48" />
        <div className="lg:col-span-1 rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/15 p-6 h-48" />
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
// Replaces the chart with a friendly call-to-action.
// ─────────────────────────────────────────────────────────────────
function EmptyProgressChart() {
  return (
    <div className="rounded-2xl bg-[#FBF8F0] p-6 border border-[#2E4F42]/12 shadow-[var(--shadow-card)] flex flex-col gap-4">
      <div>
        <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#1B332C]">
          YOUR LEARNING PROGRESS
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6B5F] font-normal mt-0.5">
          Accuracy & performance evolution over time
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-[#F1EDE1]/50 border border-[#2E4F42]/08 p-10 gap-3 min-h-[200px]">
        <span className="text-4xl">📊</span>
        <p className="font-sans text-lg font-bold text-[#1B332C] text-center">
          No assessment history yet.
        </p>
        <p className="text-sm text-[#5B6B5F] text-center max-w-xs">
          Complete your first assessment to start tracking your learning progress here.
        </p>
        <a
          href="/assessment"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-4 py-2 text-sm font-semibold text-[#E8C547] border border-[#C4952A]/40 hover:bg-[#2E4F42] transition-colors"
        >
          Browse Assessments →
        </a>
      </div>
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
        // Re-fetch the whole dashboard so roadmap, skillGap, etc. reflect the new goal
        await fetchDashboard();
      }
    } catch (err) {
      console.error("[Dashboard] Career goal update failed:", err);
    }
  };

  // ── Loading state
  if (loading) {
    return (
      <div className="min-h-screen py-6 sm:py-10">
        <Container size="wide">
          <DashboardSkeleton />
        </Container>
      </div>
    );
  }

  // ── Error state
  if (error || !dashData) {
    return (
      <div className="min-h-screen py-6 sm:py-10">
        <Container size="wide">
          <DashboardError onRetry={fetchDashboard} />
        </Container>
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
    <div className="min-h-screen py-6 sm:py-10">
      <Container size="wide">
        <div className="flex flex-col gap-8">
          {/* 1. DASHBOARD HEADER WITH ROTATING MOTIVATIONAL QUOTES */}
          <DashboardHeader 
            user={user} 
            quotes={[]} 
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />

          {/* 2. LEARNING OVERVIEW (4 STAT CARDS) */}
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

          {/* 3. LEARNING PROGRESS CHART & 4. AI LEARNING INSIGHT */}
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

          {/* AI RECOMMENDED ASSESSMENTS */}
          {recommended && recommended.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="font-sans text-2xl font-bold text-[#1B332C]">Recommended for You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommended.slice(0, 3).map((assessment) => (
                  <div key={assessment.id} className="flex flex-col rounded-2xl bg-[#FBF8F0] p-6 border border-[#2E4F42]/12 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-semibold uppercase text-[var(--color-primary-600)] bg-[var(--color-primary-50)] px-2 py-1 rounded-md">
                        {assessment.category}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">
                        {assessment.difficulty}
                      </span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-[#1B332C] mb-2">{assessment.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4 flex-1">{assessment.description}</p>
                    
                    {assessment.recommendationReason && (
                      <div className="text-xs font-medium text-[#C4952A] bg-[#EDE6D3] p-2 rounded-lg mb-4">
                        💡 {assessment.recommendationReason}
                      </div>
                    )}
                    
                    <Link to={`/assessment/${assessment.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B332C] px-4 py-2.5 text-sm font-semibold text-[#E8C547] hover:bg-[#2E4F42] transition-colors w-full">
                      Start Assessment
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. COGNIFY AI MODULES (ConceptRoot, MistakeMap, SkillGap) */}
          <div>
            <CognifyModules
              conceptRoot={conceptRoot}
              mistakeMap={mistakeMap}
              skillGap={skillGap}
            />
          </div>

          {/* 6. LEARNING ROADMAP */}
          <div>
            <RoadmapSection roadmap={roadmap} />
          </div>

          {/* 7. RECENT ASSESSMENTS */}
          <div>
            <RecentAssessmentsTable assessments={assessments} />
          </div>

          {/* 8. RECOMMENDED NEXT STEPS & 9. CAREER GOAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div className="rounded-md bg-[#1B332C] p-6 sm:p-8 shadow-[var(--shadow-card)] text-[#FBF8F0] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4952A] rounded-full mix-blend-multiply filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="font-sans text-2xl font-bold text-[#E8C547] flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Personal Intelligence
                    </h3>
                    <p className="mt-2 text-sm text-[#FBF8F0]/80 max-w-md">
                      Your AI-powered learning companion. Get personalized advice, ask questions about your mistakes, and plan your next steps based on your actual performance data.
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
        </div>
      </Container>
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
