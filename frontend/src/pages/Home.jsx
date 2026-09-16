import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import Card from "../components/Card";
import Button from "../components/Button";
import CtaBanner from "../components/CtaBanner";
import { dashboardApi } from "../services/api";
import { useStudentAuth } from "../context/StudentAuthContext";
import { isStudentUser } from "../utils/studentAuthStorage";

/* =========================================================
   REUSABLE SVG ICONS
========================================================= */
function SparklesIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

/* =========================================================
   PAGE DATA
========================================================= */
const AIFINITY_MODULES = [
  { eyebrow: "01", title: "ConceptRoot AI", description: "Identifies weak concepts and provides personalized concept explanations.", href: "/concept-root", tag: "Prerequisite Intelligence" },
  { eyebrow: "02", title: "MistakeMap AI", description: "Analyzes assessment mistakes and identifies recurring error patterns.", href: "/mistake-map", tag: "Error Pattern Tracking" },
  { eyebrow: "03", title: "SkillGap AI", description: "Compares assessment performance with required skills and identifies skill gaps.", href: "/skill-gap", tag: "Job Readiness Scoring" },
  { eyebrow: "04", title: "Personalized Roadmap", description: "Dynamically generates a learning path based on your assessment, weaknesses, skills, and goals.", href: "/roadmap", tag: "Dynamic Pathing" },
  { eyebrow: "05", title: "AI Learning Dashboard", description: "Brings progress, assessment insights, skill gaps, mistakes, and roadmap progress together.", href: "/dashboard", tag: "Unified View" },
];

const STEPS = [
  { step: "01", title: "Take the Assessment", description: "A short, adaptive test evaluating your reasoning and depth across foundational concepts." },
  { step: "02", title: "Get Your Custom Roadmap", description: "An end-to-end guidance roadmap built dynamically from your empirical test output." },
  { step: "03", title: "Track Career Readiness", description: "Watch your skill gap close live as you master targeted milestone concepts." },
];

const OBSERVATORY_TABS = [
  { id: "tracking", title: "Real-time concept tracking", description: "Every question you attempt is mapped back to its root concept live.", stat: "99.4% Accuracy", badge: "Live Telemetry" },
  { id: "pattern", title: "Pattern detection", description: "AI spots recurring mistake patterns before they become major learning bottlenecks.", stat: "3.2x Faster Learning", badge: "Predictive AI" },
  { id: "adaptive", title: "Adaptive difficulty", description: "Your roadmap automatically adjusts in real-time as your skill gap closes.", stat: "100% Dynamic", badge: "Auto Optimization" },
];

const CHALLENGE_SOLUTIONS = [
  { challenge: "Don't know which topic to revise first", solution: "Concept Root isolates the exact weak spot" },
  { challenge: "Mistakes repeat without knowing why", solution: "Mistake Map traces every error to its root cause" },
  { challenge: "Generic courses don't match the job role", solution: "Skill Gap ranks what actually matters for hiring" },
];

export default function Home() {
  const [activeObsTab, setActiveObsTab] = useState(OBSERVATORY_TABS[0]);
  const { user: sessionUser } = useStudentAuth();
  const [userData, setUserData] = useState(sessionUser);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    setUserData(sessionUser);
  }, [sessionUser]);

  useEffect(() => {
    let isMounted = true;
    dashboardApi
      .get()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setDashboardData(res.data);
          if (isStudentUser(res.data.user)) {
            setUserData(res.data.user);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* =========================================================
         HERO SECTION
      ========================================================= */}
      <HeroSection
        variant="home"
        eyebrow="AIFinity · Built for Job-Ready Learning"
        title="Know exactly what to"
        highlightWord="learn next"
        description="Find your weak concepts, see your skill gap, and follow an end-to-end roadmap built around your own mistakes — not a generic syllabus."
        primaryCta={{
          label: userData ? "⚡ Take Assessment" : "Start Free Assessment",
          href: "/assessment",
        }}
        secondaryCta={{
          label: userData ? "View Dashboard" : "Explore Roadmap",
          href: userData ? "/dashboard" : "/roadmap",
        }}
      />

      {/* =========================================================
         PLATFORM ARCHITECTURE / OVERVIEW
      ========================================================= */}
      <Section>
        <SectionHeading
          eyebrow="PLATFORM ARCHITECTURE"
          title="One Unified Intelligent Learning Platform"
          subtitle="Watch how your initial assessment is transformed into a highly personalized learning experience through our 5 core AI modules."
        />

        <div className="mx-auto mt-12 max-w-7xl">
          {/* HOW IT WORKS — 3-step horizontal flow */}
          <div className="relative mb-14 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-0">
            {/* Step 1 */}
            <Link
              to="/assessment"
              className="group flex flex-1 flex-col items-center gap-3 rounded-2xl border border-[#2E4F42]/10 bg-white/70 px-6 py-6 text-center shadow-sm hover:border-[#C4952A]/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1B332C] shadow-md group-hover:bg-[#2E4F42] transition-colors">
                <svg className="h-7 w-7 text-[#E8C547]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-widest text-[#C4952A]">Step 01</span>
                <h4 className="text-sm font-bold text-[#1B332C] group-hover:text-[#C4952A] transition-colors">Take Assessment</h4>
                <p className="mt-1 text-xs text-[#6B7B72]">Click to start your diagnostic →</p>
              </div>
            </Link>

            {/* Arrow */}
            <div className="flex items-center justify-center px-3 text-[#C4952A] opacity-60 sm:flex-shrink-0">
              <svg className="h-5 w-5 rotate-90 sm:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-[#2E4F42]/10 bg-white/70 px-6 py-6 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E4F42]/10 shadow-sm">
                <svg className="h-7 w-7 text-[#2E4F42]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-widest text-[#2E4F42]">Step 02</span>
                <h4 className="text-sm font-bold text-[#1B332C]">AI Analysis</h4>
                <p className="mt-1 text-xs text-[#6B7B72]">Cognitive profiling & gap mapping</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center px-3 text-[#C4952A] opacity-60 sm:flex-shrink-0">
              <svg className="h-5 w-5 rotate-90 sm:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-[#C4952A]/30 bg-gradient-to-br from-[#FBF3DC] to-[#EDE6D3] px-6 py-6 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C4952A]/15 shadow-sm">
                <SparklesIcon className="h-7 w-7 text-[#C4952A]" />
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-widest text-[#C4952A]">Step 03</span>
                <h4 className="text-sm font-bold text-[#1B332C]">Personalized Intelligence</h4>
                <p className="mt-1 text-xs text-[#6B7B72]">Your unique learning engine</p>
              </div>
            </div>
          </div>

          {/* 5 AI MODULES GRID */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {AIFINITY_MODULES.map((mod, i) => {
              const accentColors = [
                { border: "#1B332C", bg: "#E8F4F0", text: "#1B332C", num: "#E8C547" },
                { border: "#C4952A", bg: "#FDF4E3", text: "#C4952A", num: "#C4952A" },
                { border: "#2E4F42", bg: "#EAF2EE", text: "#2E4F42", num: "#2E4F42" },
                { border: "#8B5CF6", bg: "#F3EEFF", text: "#7C3AED", num: "#8B5CF6" },
                { border: "#0EA5E9", bg: "#E0F2FE", text: "#0369A1", num: "#0EA5E9" },
              ][i];
              return (
                <a
                  key={mod.title}
                  href={mod.href}
                  className="group flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: `${accentColors.border}20` }}
                >
                  {/* Number badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{ background: accentColors.bg, color: accentColors.num }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                      style={{ background: accentColors.bg, color: accentColors.text }}
                    >
                      {mod.tag}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold leading-snug text-[#1B332C] group-hover:text-[#2E4F42] transition-colors">
                    {mod.title}
                  </h4>
                  <p className="flex-1 text-xs leading-relaxed text-[#6B7B72]">{mod.description}</p>

                  <span
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: accentColors.text }}
                  >
                    Explore
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </a>
              );
            })}
          </div>

          {/* OUTCOME CARD */}
          <div className="mt-10 flex justify-center">
            {userData ? (
              <div
                className="relative flex w-full max-w-xl flex-col items-center justify-center rounded-3xl border p-7 sm:p-8 text-center shadow-lg transition-all duration-300 hover:shadow-xl group"
                style={{
                  borderColor: "var(--color-primary-500)",
                  background: "linear-gradient(180deg, var(--color-surface) 0%, rgba(251, 243, 220, 0.4) 100%)",
                  boxShadow: "0 14px 36px -12px rgba(27, 51, 44, 0.15)",
                }}
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider shadow-2xs border border-[#C4952A]/30 bg-[#EDE6D3] text-[#1B332C]">
                  <span className="h-2 w-2 rounded-full bg-[#2E4F42] animate-ping" />
                  <span>{userData.name ? `${userData.name.split(" ")[0]}'s Customized Outcome` : "Your Personalized Outcome"}</span>
                </div>
                <h3 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B332C]">
                  {userData.name ? `${userData.name}'s Learning Journey` : "Personalized Learning Journey"}
                </h3>
                <p className="mt-2 text-sm text-[#5B6B5F] max-w-md leading-relaxed">
                  Tailored specifically for{" "}
                  <strong className="text-[#1B332C] font-semibold">
                    {dashboardData?.careerGoal?.role || userData?.profile?.careerGoal || "Machine Learning & AI"}
                  </strong>{" "}
                  with a dynamic milestone path addressing your exact concept gaps.
                </p>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-md">
                  <div className="rounded-xl bg-white/80 p-2.5 border border-[#2E4F42]/10 shadow-2xs">
                    <span className="block text-[10px] font-mono uppercase text-[#8B9690] font-semibold">Target Role</span>
                    <span className="text-xs font-bold text-[#1B332C] truncate block mt-0.5">
                      {dashboardData?.careerGoal?.role || userData?.profile?.careerGoal || "ML Engineer"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5 border border-[#2E4F42]/10 shadow-2xs">
                    <span className="block text-[10px] font-mono uppercase text-[#2E4F42] font-semibold">Readiness</span>
                    <span className="text-xs font-bold text-[#2E4F42] block mt-0.5">
                      {dashboardData?.skillGap?.matchPercentage || 78}% Match
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5 border border-[#2E4F42]/10 shadow-2xs col-span-2 sm:col-span-1">
                    <span className="block text-[10px] font-mono uppercase text-[#C4952A] font-semibold">Streak</span>
                    <span className="text-xs font-bold text-[#1B332C] block mt-0.5">
                      🔥 {dashboardData?.user?.streak ?? 7} Days
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
                  <Link
                    to="/roadmap"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-5 py-2.5 text-xs font-bold text-[#E8C547] shadow-sm hover:bg-[#2E4F42] hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <span>View Your Roadmap</span>
                    <span>→</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#1B332C] border border-[#2E4F42]/20 hover:bg-[#EDE6D3] transition-all duration-200"
                  >
                    <span>Open Dashboard</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div
                className="relative flex w-full max-w-md flex-col items-center justify-center rounded-3xl border px-8 py-7 text-center shadow-lg transition-transform hover:scale-105"
                style={{ borderColor: "var(--color-primary-600)", background: "var(--color-surface)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
              >
                <span
                  className="mb-3 inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider shadow-2xs"
                  style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}
                >
                  ✦ The Outcome
                </span>
                <h3 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1B332C] tracking-tight">
                  Personalized Learning Journey
                </h3>
                <p className="mt-2 text-sm text-[#5B6B5F] leading-relaxed">
                  A dynamically generated path leading directly to your career goals, tailored to your exact mistake patterns.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <span className="rounded-md bg-[#EDE6D3] px-2.5 py-1 text-[11px] font-mono text-[#1B332C] font-semibold">
                    🎯 Dynamic Gap Detection
                  </span>
                  <span className="rounded-md bg-[#EDE6D3] px-2.5 py-1 text-[11px] font-mono text-[#1B332C] font-semibold">
                    🛣️ Milestone Pathing
                  </span>
                </div>
                <Link
                  to="/assessment"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-5 py-2.5 text-xs font-bold text-[#E8C547] shadow-sm hover:bg-[#2E4F42] hover:text-white transition-all duration-200"
                >
                  <span>Start Your Personalized Journey →</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="WHY IT WORKS"
          title="Every challenge, matched with a direct solution"
          subtitle="No generic advice — just specific fixes for specific learning bottlenecks."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CHALLENGE_SOLUTIONS.map((item) => (
            <Card key={item.challenge} hoverable>
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: "var(--color-error)", color: "#fff", opacity: 0.85 }}
                >
                  ✕
                </span>
                <p className="text-sm font-medium leading-5" style={{ color: "var(--color-text-muted)" }}>
                  {item.challenge}
                </p>
              </div>

              <div className="my-4 border-t" style={{ borderColor: "var(--color-border)" }} />

              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: "var(--color-confirm)", color: "#fff" }}
                >
                  ✓
                </span>
                <p className="text-sm font-bold leading-5" style={{ color: "var(--color-text-h)" }}>
                  {item.solution}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* =========================================================
         AI OBSERVATORY INTERACTIVE PREVIEW
      ========================================================= */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div
            className="order-2 lg:order-1 relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-300 hover:shadow-2xl"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                >
                  {activeObsTab.badge}
                </span>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)", fontFamily: "var(--font-mono)" }}
              >
                {activeObsTab.stat}
              </span>
            </div>

            <div className="py-8 text-center">
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg"
                style={{ background: "var(--color-primary-600)" }}
              >
                <SparklesIcon className="w-10 h-10" />
              </div>

              <h4 className="mt-5 text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
                {activeObsTab.title}
              </h4>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                {activeObsTab.description}
              </p>
            </div>

            <div
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)" }}
            >
              <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
                Continuous AI Evaluation Active
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex flex-col items-start gap-5 text-left">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-mono)",
                borderColor: "var(--color-border-strong)",
                background: "var(--color-primary-50)",
                color: "var(--color-primary-700)",
              }}
            >
              AI Observatory Engine
            </span>

            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}
            >
              An AI that watches your progress, so you don't have to guess
            </h2>

            <p className="text-base leading-7" style={{ color: "var(--color-text-muted)" }}>
              Every attempt, mistake, and concept is continuously analyzed and turned into a clear picture of your readiness.
            </p>

            <div className="mt-2 flex flex-col gap-3 w-full">
              {OBSERVATORY_TABS.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveObsTab(tab)}
                  className="cursor-pointer rounded-2xl border p-4 transition-all duration-200"
                  style={
                    activeObsTab.id === tab.id
                      ? { borderColor: "var(--color-primary-600)", background: "var(--color-primary-50)", boxShadow: "var(--shadow-card-hover)" }
                      : { borderColor: "var(--color-border)", background: "var(--color-surface)" }
                  }
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm" style={{ color: "var(--color-text-h)" }}>{tab.title}</p>
                    <span className="text-xs font-bold" style={{ color: "var(--color-primary-600)" }}>{tab.stat}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                    {tab.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* =========================================================
         HOW IT WORKS — 3 STEP FLOW
      ========================================================= */}
      <Section>
        <SectionHeading eyebrow="THREE-STEP FLOW" title="From assessment to roadmap in three steps" />

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <Card
              key={step.step}
              hoverable
              className="text-center"
              icon={<span style={{ fontFamily: "var(--font-mono)" }} className="text-lg font-bold">{step.step}</span>}
              title={step.title}
            >
              {step.description}
            </Card>
          ))}
        </div>
      </Section>

      {/* =========================================================
         FINAL CTA BANNER
      ========================================================= */}
      <Section>
        <CtaBanner
          eyebrow="READY TO BEGIN?"
          title="Your career skill gap is waiting for you."
          buttonLabel="Start Free Assessment"
          href="/onboardingpage"
        />
      </Section>
    </div>
  );
}