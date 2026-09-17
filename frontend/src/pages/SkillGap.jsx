import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";
import { analyticsApi } from "../services/api";

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

function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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

function SpinnerIcon({ className = "w-5 h-5 animate-spin" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

/* =========================================================
   SUB-COMPONENTS 
========================================================= */
function ScoreRing({ score }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-surface-secondary)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="var(--color-primary-600)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>{score}</span>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-light)" }}>/ 100</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, className = "" }) {
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full ${className}`} style={{ background: "var(--color-surface-secondary)" }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: "var(--color-primary-600)" }}
      />
    </div>
  );
}

function GapBar({ current, target }) {
  return (
    <div className="space-y-2">
      <div className="relative h-3 overflow-hidden rounded-full" style={{ background: "var(--color-surface-secondary)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: `${current}%`, background: "var(--color-primary-600)" }} />
        <div className="absolute inset-y-0 w-1.5 rounded-full shadow-sm" style={{ left: `${target}%`, background: "var(--color-accent)" }} />
      </div>

      <div className="flex justify-between text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
        <span>Current: {current}%</span>
        <span className="font-bold" style={{ color: "var(--color-primary-600)" }}>Target: {target}%</span>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN SKILL GAP COMPONENT
========================================================= */
export default function SkillGap() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeGap, setActiveGap] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    analyticsApi.getSkillGap()
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error("Failed to load skill gap:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredGaps = useMemo(() => {
    if (!data || !data.hasData || !data.skills || !data.skills.skillGaps) return [];
    if (priorityFilter === "All") return data.skills.skillGaps;
    return data.skills.skillGaps.filter((g) => (g.priority || 'medium').toLowerCase() === priorityFilter.toLowerCase());
  }, [data, priorityFilter]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <SpinnerIcon className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeroSection
          variant="skill-gap"
          eyebrow="AIFinity AI · Skill Gap Analysis"
          title="Know exactly where you"
          highlightWord="stand — and what's next."
          description="Discover your exact proficiency level in any skill with AI-powered analysis. Get personalized insights into your strengths and the gaps you need to close for your target career role."
          primaryCta={{ label: "Take an Assessment to Begin", href: "/assessments" }}
          secondaryCta={{ label: "Go to Dashboard", href: "/dashboard" }}
        />
        <Section id="how-it-works" className="pt-0 sm:pt-0">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
              No Data Available Yet
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-muted)" }}>
              You haven't completed any assessments yet. AIFinity requires real empirical evidence from your assessment attempts to accurately measure your skills and identify gaps for your target role: <strong>{data?.user?.careerGoal || 'Selected Role'}</strong>.
            </p>
          </div>
        </Section>
      </div>
    );
  }

  const averageGap = Math.round(
    (data.skills.skillGaps || []).reduce((sum, gap) => sum + Math.max(gap.target - gap.current, 0), 0) / 
    Math.max(data.skills.skillGaps.length, 1)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection
        variant="skill-gap"
        eyebrow="AIFinity AI · Skill Gap Analysis"
        title="Know exactly where you"
        highlightWord="stand — and what's next."
        description={`Analysis based on your empirical assessment history evaluated against target role: ${data.user.careerGoal}.`}
        primaryCta={{ label: "View Roadmap", href: "/roadmap" }}
        secondaryCta={{ label: "Take Another Assessment", href: "/assessments" }}
      />

      <Section id="analysis-result">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Empirical Skill Analysis ({data.performance.totalAssessments} Assessments)
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
              Here's what we discovered
            </h2>
            
            {data.skills.aiStatus === "pending" && (
              <p className="mt-2 text-sm text-yellow-600 font-medium">AI Insights are currently generating...</p>
            )}
            {data.skills.aiStatus === "unavailable" && (
              <p className="mt-2 text-sm text-red-600 font-medium">AI Insights are temporarily unavailable. Displaying deterministic metrics only.</p>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card hoverable={false} className="p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ScoreRing score={data.performance.overallScore} />

              <div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>
                  Demonstrated Capability
                </span>

                <h3 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
                  {data.performance.overallScore >= 75 ? "Strong Capability Foundation" : data.performance.overallScore >= 60 ? "Developing Capability" : "Early Stage Capability"}
                </h3>

                <p className="mt-2 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                  Based strictly on deterministic evidence collected from your assessments.
                </p>
              </div>
            </div>
          </Card>

          <Card hoverable={false} className="p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>
              Estimated Career Gap
            </span>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>{averageGap}</span>
              <span className="mb-1 text-xs font-medium" style={{ color: "var(--color-text-light)" }}>points average skill gap</span>
            </div>

            <div className="mt-4">
              <ProgressBar value={Math.min(averageGap * 2.5, 100)} />
            </div>

            <p className="mt-3 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
              The smaller this gap number, the closer your demonstrated abilities match your target role.
            </p>
          </Card>
        </div>

        {/* Strengths List */}
        {data.skills.strengths && data.skills.strengths.length > 0 && (
          <div className="mt-6">
            <Card hoverable={false} className="p-5 shadow-sm transition-all duration-300 hover:shadow-lg" style={{ borderColor: "var(--color-primary-100)" }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-600)" }}>
                  <CheckIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold" style={{ color: "var(--color-text-h)" }}>Demonstrated Strengths</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.skills.strengths.map((str) => (
                      <span
                        key={str}
                        className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                        style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}
                      >
                        ✓ {str}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Gaps List & Priority Filter */}
        <div className="mt-10">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold" style={{ color: "var(--color-text-h)" }}>Identified Skill Gaps</h3>
              <p className="text-xs" style={{ color: "var(--color-text-light)" }}>Focus on these areas to reach target proficiency.</p>
            </div>

            <div className="flex gap-1.5">
              {["All", "High", "Medium"].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setPriorityFilter(priority)}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 active:scale-95"
                  style={
                    priorityFilter === priority
                      ? { background: "var(--color-primary-600)", color: "#fff" }
                      : { border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }
                  }
                >
                  {priority} Priority
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {filteredGaps.length === 0 && (
              <div className="col-span-3 py-8 text-center text-sm text-gray-500">
                No gaps identified in this priority tier.
              </div>
            )}
            
            {filteredGaps.map((gap, index) => {
              const expanded = activeGap === index;
              return (
                <button key={gap.name} type="button" onClick={() => setActiveGap(expanded ? null : index)} className="text-left w-full">
                  <Card
                    hoverable
                    className="h-full w-full"
                    style={expanded ? { boxShadow: "var(--shadow-card-hover)", borderColor: "var(--color-primary-600)" } : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}>
                        0{index + 1}
                      </span>
                      <span
                        className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={
                          gap.priority === "high"
                            ? { borderColor: "var(--color-primary-200)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" }
                            : { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" }
                        }
                      >
                        {gap.priority}
                      </span>
                    </div>

                    <h4 className="mt-3 font-bold text-base" style={{ color: "var(--color-text-h)" }}>{gap.name}</h4>
                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>{gap.description}</p>
                    
                    {gap.confidence && (
                       <p className="mt-1 text-[10px] font-mono text-primary-600">Evidence Confidence: {gap.confidence}%</p>
                    )}

                    <div className="mt-4">
                      <GapBar current={gap.current} target={gap.target} />
                    </div>

                    {(gap.actionPlan || gap.practiceFocus) && (
                      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                        <span className="text-xs font-semibold" style={{ color: "var(--color-primary-600)" }}>
                          {expanded ? "Hide details" : "View recommendations"}
                        </span>
                        <ArrowRightIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} style={{ color: "var(--color-primary-600)" }} />
                      </div>
                    )}

                    {expanded && (gap.actionPlan || gap.practiceFocus) && (
                      <div className="mt-3 flex flex-col gap-3 rounded-lg p-3 text-xs leading-5" style={{ background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" }}>
                        {gap.actionPlan && (
                          <div>
                            <strong style={{ color: "var(--color-text-h)" }}>Action Plan:</strong>
                            <p className="mt-1">{gap.actionPlan}</p>
                          </div>
                        )}
                        {gap.practiceFocus && (
                          <div>
                            <strong style={{ color: "var(--color-text-h)" }}>Practice Focus:</strong>
                            <p className="mt-1">{gap.practiceFocus}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* FINAL CTA BANNER */}
      <Section>
        <CtaBanner
          eyebrow="EVIDENCE-BASED LEARNING"
          title="Turn your skill gaps into personalized roadmaps."
          buttonLabel="View Personalized Roadmap"
          href="/roadmap"
        />
      </Section>
    </div>
  );
}
