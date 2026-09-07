import React, { useEffect, useState } from "react";
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
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";
import { analyticsApi } from "../services/api";

const HOW_IT_WORKS = [
  {
    title: "You attempt a question",
    description:
      "Practice like normal — assessments, quizzes, or mock tests across any topic.",
  },
  {
    title: "AI finds the real reason",
    description:
      "Every wrong answer is traced back to the exact concept behind it, not just marked incorrect.",
  },
  {
    title: "It's added to your map",
    description:
      "The concept gets placed on your Mistake Map, ranked by how often it's costing you marks.",
  },
];

const FEATURES = [
  {
    eyebrow: "Root cause",
    title: "AI-Detected Patterns",
    description:
      "The AI looks past the wrong answer to the concept you actually misunderstood — so you fix the cause, not the symptom.",
  },
  {
    eyebrow: "Clustering",
    title: "Concept Clustering",
    description:
      "Related mistakes group together automatically, so five wrong answers can point to one real gap.",
  },
  {
    eyebrow: "Priority",
    title: "Ranked by Impact",
    description:
      "Your map is sorted by which concepts are costing you the most — fix what matters first.",
  },
];

const COMPARISON = [
  {
    without: "Redo entire mock tests hoping the same mistakes don't repeat",
    withMap: "See exactly which concepts to revise, ranked by impact",
  },
  {
    without: "Wrong answers just get marked incorrect, nothing more",
    withMap: "Every wrong answer traced back to the concept behind it",
  },
  {
    without: "Manually figure out if a mistake is a pattern or a one-off",
    withMap: "Patterns get clustered and flagged automatically",
  },
  {
    without: "One subject at a time, tracked separately",
    withMap: "Coding, aptitude, GK, verbal — all traced the same way",
  },
];

// Chart colors
const CHART_COLOR_BEFORE = "#9CA3AF";
const CHART_COLOR_PRIMARY = "#14776e";
const CHART_COLOR_ATTENTION = "#f59e0b";

// Custom tooltip rendered based on the active topic entry
function ProgressTooltip({ active, payload, label, data = [] }) {
  if (!active || !payload || !payload.length) return null;
  const row = data.find((t) => t.concept === label);
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="mb-1 text-xs font-semibold text-[var(--color-text-h)]">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs text-[var(--color-text-muted)]">
          {p.name}: <span className="font-medium text-[var(--color-text-h)]">{p.value}</span>
        </p>
      ))}
      {row?.needsAttention && (
        <p className="mt-1 text-xs font-semibold text-amber-600">Needs attention</p>
      )}
    </div>
  );
}

// One row in the per-topic breakdown panel.
function TopicRow({ topic }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--color-text-h)]">
          {topic.concept}
        </span>
        <span
          className={[
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            topic.needsAttention
              ? "bg-amber-100 text-amber-700"
              : "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
          ].join(" ")}
        >
          {topic.before} → {topic.after}
        </span>
      </div>

      {expanded && (
        <>
          <p className="mt-1 text-xs font-medium text-[var(--color-text-body)]">
            Mistake: {topic.mistakePattern}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {topic.needsAttention ? "Why it's repeating: " : "What improved: "}
            {topic.needsAttention ? topic.whyItHappened : topic.whatChanged}
          </p>
          {topic.needsAttention && (
            <p className="mt-1 text-xs font-semibold text-amber-600">
              ⚠ Needs attention — same mistake keeps repeating
            </p>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-xs font-semibold text-[var(--color-primary-600)] hover:underline"
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
}

export default function MistakeMapPage() {
  const [topicProgress, setTopicProgress] = useState([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getMistakeMap()
      .then((res) => {
        if (res && res.success && res.data) {
          if (res.data.hasHistory && Array.isArray(res.data.topicProgress) && res.data.topicProgress.length > 0) {
            setHasHistory(true);
            setTopicProgress(res.data.topicProgress);
          } else {
            setHasHistory(false);
            setTopicProgress([]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load Mistake Map analytics:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col ">
      {/* Hero */}
      <HeroSection
        variant="mistake-map"
        eyebrow="AI-Powered · Mistake Map"
        title="Every mistake,"
        highlightWord="mapped to its cause"
        description="Wrong answers don't just get marked incorrect. Our AI traces each one back to the concept behind it, so you always know exactly what to fix."
        primaryCta={{ label: "See Your Mistake Map", href: "/assessment" }}
        secondaryCta={{ label: "How It Works", href: "#how-it-works" }}
      />

      {/* How it works */}
      <Section id="how-it-works">
        <SectionHeading
          title="From wrong answer to clear fix, automatically"
          subtitle="No manual tagging. The AI does the tracing so your map stays accurate on its own."
        />
        <div className="relative mt-10">
          <div
            className="absolute left-0 right-0 top-[22px] hidden h-px bg-[var(--color-primary-100)] sm:block"
            aria-hidden="true"
          />
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
                <p className="max-w-xs text-base leading-relaxed text-[var(--color-text-muted)]">
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
          title="Built to find the real gap, not just the wrong answer"
          subtitle="Three ways the AI keeps your map accurate and useful."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              eyebrow={feature.eyebrow}
              title={feature.title}
            >
              {feature.description}
            </Card>
          ))}
        </div>
      </Section>

      {/* Your Progress — real recharts bar graph, before vs now per topic */}
      <Section>
        <SectionHeading
          title="Your progress, topic by topic"
          subtitle="How many mistakes you made before vs. now — topics still flagged in amber need more work."
        />

        {loading ? (
          <div className="mx-auto mt-10 flex h-64 max-w-xl items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-muted)]">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent" />
              Loading your Mistake Map telemetry...
            </div>
          </div>
        ) : topicProgress.length > 0 ? (
          <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
            {/* Chart */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={topicProgress}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="concept"
                    tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Mistakes",
                      angle: -90,
                      position: "insideLeft",
                      fill: "var(--color-text-muted)",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    content={<ProgressTooltip data={topicProgress} />}
                    cursor={{ fill: "var(--color-surface-secondary)" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)" }}
                  />
                  <Bar dataKey="before" name="Before" fill={CHART_COLOR_BEFORE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="after" name="Now" fill={CHART_COLOR_PRIMARY} radius={[4, 4, 0, 0]}>
                    {topicProgress.map((entry) => (
                      <Cell
                        key={entry.concept}
                        fill={entry.needsAttention ? CHART_COLOR_ATTENTION : CHART_COLOR_PRIMARY}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend for the attention flag */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary-600)]" />
                  Improved / stable
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Needs attention
                </span>
              </div>
            </div>

            {/* Per-topic breakdown */}
            <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
              <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-h)]">
                Topic by topic — what's actually going on
              </h3>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {topicProgress.map((topic) => (
                  <TopicRow key={topic.concept} topic={topic} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-h)]">No Mistake Patterns Detected Yet</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Complete practice assessments to allow our diagnostic engine to trace error patterns back to their root concepts and populate your personalized progress map.
            </p>
            <div className="mt-6 flex justify-center">
              <Button as="a" href="/assessment" size="md">
                Take An Assessment
              </Button>
            </div>
          </div>
        )}

        {topicProgress.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Button as="a" href="/assessment" size="lg">
              Take Another Assessment
            </Button>
          </div>
        )}
      </Section>

      {/* Without vs With — comparison */}
      <Section>
        <SectionHeading
          title="What changes once you have a Mistake Map"
          subtitle="Same mistakes, same test results — just organized into something you can act on."
        />
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2">
            <div className="border-b border-r border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-5 py-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
              Without Mistake Map
            </div>
            <div className="border-b border-[var(--color-border)] bg-[var(--color-primary-50)] px-5 py-4 text-center text-sm font-semibold text-[var(--color-primary-700)]">
              With Mistake Map
            </div>
          </div>
          {COMPARISON.map((row, index) => (
            <div key={index} className="grid grid-cols-2">
              <div
                className={[
                  "flex items-start gap-2 border-r border-[var(--color-border)] px-5 py-4 text-sm leading-relaxed text-[var(--color-text-muted)]",
                  index !== COMPARISON.length - 1
                    ? "border-b border-[var(--color-border)]"
                    : "",
                ].join(" ")}
              >
                <span className="mt-0.5 shrink-0 text-[var(--color-text-light)]">✕</span>
                {row.without}
              </div>
              <div
                className={[
                  "flex items-start gap-2 bg-[var(--color-primary-50)]/40 px-5 py-4 text-sm leading-relaxed text-[var(--color-text-body)]",
                  index !== COMPARISON.length - 1
                    ? "border-b border-[var(--color-border)]"
                    : "",
                ].join(" ")}
              >
                <span className="mt-0.5 shrink-0 text-[var(--color-primary-600)]">✓</span>
                {row.withMap}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <CtaBanner
          eyebrow="Ready to begin?"
          title="Your skill gap is waiting for you."
          subtitle="Takes less than 10 minutes. No sign-up required to see your first result."
          buttonLabel="Start Free Assessment"
          href="/assessment"
        />
      </Section>
    </div>
  );
}
