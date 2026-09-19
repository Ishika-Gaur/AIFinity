import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Section from "../components/Section";
import HeroSection from "../components/HeroSection";
import { skillGapApi } from "../services/api";

/* Same key OnboardingPage.jsx writes to. Used only as a fallback
   for the goal name if the API doesn't send targetCareer. */
const ONBOARDING_STORAGE_KEY = "aifinity_onboarding_profile";

/* A skill is "close" when it is within this many points of the target. */
const CLOSE_THRESHOLD = 15;

/* Chart view adapts to the number of skills:
   1-2 skills -> side-by-side columns, 3-8 -> radar,
   9+ -> radar of the biggest gaps (the List view always shows everything). */
const RADAR_MIN = 3;
const RADAR_MAX = 8;

/* Change these if your router paths are different. */
const ROUTES = {
  roadmap: "/roadmap",
  assessment: "/assessment",
  concepts: "/concept-root",
  mistakes: "/mistake-map",
  onboarding: "/onboarding",
};

/* Adds ?skill=<name> so the target page CAN filter by skill
   (via useSearchParams). If it doesn't read it, the page just opens normally. */
const withSkill = (path, name) => `${path}?skill=${encodeURIComponent(name)}`;

const LINK_FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]";
const LINK_BASE = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 ${LINK_FOCUS}`;
const LINK_SM = `inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 ${LINK_FOCUS}`;
const LINK_PRIMARY_STYLE = { background: "var(--color-primary-600)", color: "#fff" };
const LINK_SECONDARY_STYLE = {
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-h)",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "needs-work", label: "Needs work" },
  { id: "close", label: "Almost there" },
  { id: "on-target", label: "On target" },
];

/* Status is always shown as a text label, never by color alone. */
const STATUS = {
  "needs-work": {
    label: "Needs work",
    style: { borderColor: "var(--color-accent)", background: "var(--color-surface)", color: "var(--color-text-h)" },
  },
  close: {
    label: "Almost there",
    style: { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" },
  },
  "on-target": {
    label: "On target",
    style: { borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" },
  },
};

/* =========================================================
   DATA MAPPING
   Optional backend fields (progress + time estimates) are read in
   the small helpers below. If the API doesn't send them, the UI for
   those features simply doesn't render. Adjust field names here.
========================================================= */
function getOnboardingGoal() {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.careerGoal || null : null;
  } catch {
    return null;
  }
}

function toNumber(value) {
  const n = Number(value);
  return value !== null && value !== undefined && Number.isFinite(n) ? n : null;
}

function getStatus(gap) {
  if (gap <= 0) return "on-target";
  if (gap <= CLOSE_THRESHOLD) return "close";
  return "needs-work";
}

/* Expects data.history (or data.scoreHistory) = [{ score, date }, ...],
   oldest first, latest score last. Returns [] when absent. */
function normalizeHistory(data) {
  const raw = Array.isArray(data.history)
    ? data.history
    : Array.isArray(data.scoreHistory)
    ? data.scoreHistory
    : [];

  const items = raw
    .map((h) => ({
      score: toNumber(h.score ?? h.overallProficiency),
      date: h.date ?? h.createdAt ?? null,
    }))
    .filter((h) => h.score !== null);

  if (items.length > 1 && items.every((h) => h.date)) {
    items.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  return items;
}

/* Expects skill.estimatedDays (or timeToCloseDays). Returns null when absent. */
function readEstimate(skill) {
  const days = toNumber(skill.estimatedDays ?? skill.timeToCloseDays);
  if (days === null || days <= 0) return null;
  if (days < 14) {
    const d = Math.round(days);
    return `~${d} day${d === 1 ? "" : "s"}`;
  }
  const w = Math.round(days / 7);
  return `~${w} week${w === 1 ? "" : "s"}`;
}

function mapResponse(data) {
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const score = data.overallProficiency ?? 0;

  const mapped = skills
    .map((skill) => {
      const current = skill.currentProficiency ?? 0;
      const target = skill.requiredProficiency ?? 0;
      const gap = Math.max(target - current, 0);
      return {
        id: skill.skillId || skill.skillName,
        name: skill.skillName,
        current,
        target,
        gap,
        status: getStatus(gap),
        description: skill.aiExplanation || "",
        recommendation:
          (skill.recommendations && skill.recommendations[0]) ||
          "Keep practicing the weaker concepts in this skill.",
        estimate: readEstimate(skill),
      };
    })
    .sort((a, b) => b.gap - a.gap); // biggest gap first

  const history = normalizeHistory(data);
  const previous =
    toNumber(data.previousScore) ?? (history.length >= 2 ? history[history.length - 2].score : null);

  return {
    hasData: Boolean(data.hasData),
    goal: data.targetCareer || getOnboardingGoal() || "your target role",
    score,
    skills: mapped,
    progress: {
      delta: previous === null ? null : Math.round(score - previous),
      scores: history.map((h) => h.score),
    },
  };
}

/* =========================================================
   PIECES
========================================================= */
function ScoreRing({ score }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div className="relative h-28 w-28 shrink-0 lg:h-36 lg:w-36">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 120 120"
        role="progressbar"
        aria-label="Overall proficiency"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-surface-secondary)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--color-primary-600)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold lg:text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
          {score}
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-light)" }}>out of 100</span>
      </div>
    </div>
  );
}

/* Tiny score trend. Only rendered with 2+ past scores. */
function Sparkline({ scores }) {
  const W = 160;
  const H = 36;
  const pad = 4;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min || 1;

  const pts = scores.map((v, i) => [
    pad + (i * (W - pad * 2)) / (scores.length - 1),
    H - pad - ((v - min) / span) * (H - pad * 2),
  ]);
  const last = pts[pts.length - 1];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Score trend: ${scores.join(", ")}`}>
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--color-primary-600)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--color-primary-600)" />
    </svg>
  );
}

function ProgressBlock({ progress }) {
  const { delta, scores } = progress;
  const hasDelta = delta !== null;
  const hasTrend = scores.length >= 2;
  if (!hasDelta && !hasTrend) return null;

  const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : null;

  return (
    <div
      className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t pt-4 lg:justify-between"
      style={{ borderColor: "var(--color-border)" }}
    >
      {hasDelta && (
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={
            delta > 0
              ? { background: "var(--color-primary-50)", color: "var(--color-primary-700)" }
              : { background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" }
          }
        >
          {deltaText ? `${deltaText} points` : "No change"} since last assessment
        </span>
      )}
      {hasTrend && <Sparkline scores={scores} />}
    </div>
  );
}

/* Bar = your level. Thin line = level the role needs. */
function LevelBar({ current, target }) {
  return (
    <div className="relative h-2">
      <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: "var(--color-surface-secondary)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(current, 100)}%`, background: "var(--color-primary-600)" }}
        />
      </div>
      <div
        className="absolute -bottom-1 -top-1 w-0.5 rounded-full"
        style={{ left: `calc(${Math.min(target, 100)}% - 1px)`, background: "var(--color-accent)" }}
      />
    </div>
  );
}

function RadarChart({ skills }) {
  const W = 420;
  const H = 330;
  const cx = W / 2;
  const cy = 165;
  const R = 100;
  const n = skills.length;

  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i, value) => {
    const r = (R * Math.min(Math.max(value, 0), 100)) / 100;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const ring = (value) => skills.map((_, i) => point(i, value).join(",")).join(" ");
  const shape = (key) => skills.map((s, i) => point(i, s[key]).join(",")).join(" ");
  const short = (name) => (name.length > 16 ? `${name.slice(0, 15)}…` : name);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto h-auto w-full max-w-lg"
      role="img"
      aria-label={`Radar chart of ${n} skills: your level compared with the level needed`}
    >
      {[25, 50, 75, 100].map((v) => (
        <polygon key={v} points={ring(v)} fill="none" stroke="var(--color-border)" strokeWidth="1" />
      ))}

      {skills.map((s, i) => {
        const [x, y] = point(i, 100);
        return <line key={s.id} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-border)" strokeWidth="1" />;
      })}

      <polygon
        points={shape("target")}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeDasharray="5 4"
        strokeLinejoin="round"
      />
      <polygon
        points={shape("current")}
        fill="var(--color-primary-600)"
        fillOpacity="0.2"
        stroke="var(--color-primary-600)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {skills.map((s, i) => {
        const [x, y] = point(i, s.current);
        return <circle key={s.id} cx={x} cy={y} r="3.5" fill="var(--color-primary-600)" />;
      })}

      {skills.map((s, i) => {
        const a = angle(i);
        const lx = cx + (R + 14) * Math.cos(a);
        const ly = cy + (R + 14) * Math.sin(a);
        const cos = Math.cos(a);
        const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
        return (
          <text
            key={s.id}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="central"
            fontSize="11"
            fill="var(--color-text-muted)"
          >
            <title>{`${s.name}: ${s.current}% (needed ${s.target}%)`}</title>
            {short(s.name)}
          </text>
        );
      })}
    </svg>
  );
}

/* One column: value label on top, bar, caption underneath. Bar heights are
   in pixels so labels never squeeze the bar. */
function Column({ value, caption, needed = false, height }) {
  const barMax = height - 24; // room for the value label
  const barHeight = (Math.min(Math.max(value, 0), 100) / 100) * barMax;

  return (
    <div className="flex w-14 flex-col items-center">
      <div className="flex w-full flex-col items-center justify-end" style={{ height }}>
        <span className="mb-1 text-xs font-semibold tabular-nums" style={{ color: "var(--color-text-h)" }}>
          {value}
        </span>
        <div
          className="w-full shrink-0 rounded-t-md transition-all duration-700"
          style={{
            height: barHeight,
            ...(needed
              ? { border: "2px dashed var(--color-accent)", borderBottom: "none", background: "transparent" }
              : { background: "var(--color-primary-600)" }),
          }}
        />
      </div>
      <span className="mt-1.5 text-xs" style={{ color: "var(--color-text-light)" }}>{caption}</span>
    </div>
  );
}

/* Used when there are only 1-2 skills, where a radar has no shape. */
function ColumnChart({ skills }) {
  const height = 200;

  return (
    <div
      className="flex flex-wrap items-end justify-center gap-x-14 gap-y-8 pt-4"
      role="img"
      aria-label={`Your level compared with the level needed. ${skills
        .map((s) => `${s.name}: ${s.current} of ${s.target}`)
        .join("; ")}`}
    >
      {skills.map((s) => (
        <div key={s.id} className="flex w-44 flex-col items-center">
          <div className="flex items-end gap-4">
            <Column value={s.current} caption="You" height={height} />
            <Column value={s.target} caption="Needed" needed height={height} />
          </div>
          <p className="mt-3 text-center text-xs font-semibold leading-snug" style={{ color: "var(--color-text-h)" }}>
            {s.name}
          </p>
        </div>
      ))}
    </div>
  );
}

function SkillRow({ skill, open, onToggle }) {
  const status = STATUS[skill.status];

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-surface-secondary)] sm:grid-cols-[minmax(9rem,15rem)_1fr_4.5rem_6.5rem]"
      >
        <span className="order-1 flex min-w-0 items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text-h)" }}>
          <span className="min-w-0 break-words leading-snug">{skill.name}</span>
          <span
            className={`text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-light)" }}
            aria-hidden="true"
          >
            ▾
          </span>
        </span>

        <span
          className="order-2 justify-self-end rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:order-4"
          style={status.style}
        >
          {status.label}
        </span>

        <span className="order-3 col-span-2 sm:order-2 sm:col-span-1">
          <LevelBar current={skill.current} target={skill.target} />
        </span>

        <span className="order-3 hidden text-right text-xs tabular-nums sm:block" style={{ color: "var(--color-text-h)" }}>
          {skill.current}
          <span style={{ color: "var(--color-text-light)" }}> / {skill.target}</span>
        </span>
      </button>

      {open && (
        <div className="px-5 pb-4 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
          <p>
            You are at <strong style={{ color: "var(--color-text-h)" }}>{skill.current}%</strong>; this role needs{" "}
            <strong style={{ color: "var(--color-text-h)" }}>{skill.target}%</strong>.
            {skill.estimate && skill.gap > 0 && (
              <>
                {" "}Estimated time to close the gap:{" "}
                <strong style={{ color: "var(--color-text-h)" }}>{skill.estimate}</strong>.
              </>
            )}
          </p>
          {skill.description && <p className="mt-1.5">{skill.description}</p>}
          <p className="mt-1.5">
            <strong style={{ color: "var(--color-text-h)" }}>What to do:</strong> {skill.recommendation}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            <Link to={withSkill(ROUTES.assessment, skill.name)} className={LINK_SM} style={LINK_PRIMARY_STYLE}>
              Practice this skill
            </Link>
            <Link to={withSkill(ROUTES.mistakes, skill.name)} className={LINK_SM} style={LINK_SECONDARY_STYLE}>
              See related mistakes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NextStepCard({ step, recommended }) {
  return (
    <Link to={step.to} className={`block h-full rounded-xl ${LINK_FOCUS}`}>
      <Card
        hoverable
        className="h-full p-5"
        style={recommended ? { borderColor: "var(--color-primary-600)" } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold" style={{ color: "var(--color-text-h)" }}>{step.title}</h4>
          {recommended && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}
            >
              Recommended
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>{step.body}</p>
        <span className="mt-4 inline-block text-xs font-semibold" style={{ color: "var(--color-primary-600)" }}>
          {step.cta}
        </span>
      </Card>
    </Link>
  );
}

function ViewToggle({ view, onChange }) {
  const options = [
    { id: "list", label: "List" },
    { id: "radar", label: "Chart" },
  ];
  return (
    <div
      className="inline-flex rounded-full border p-0.5"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      role="group"
      aria-label="Switch view"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={view === o.id}
          className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          style={
            view === o.id
              ? { background: "var(--color-primary-600)", color: "#fff" }
              : { color: "var(--color-text-muted)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Notice({ title, children, action }) {
  return (
    <Card hoverable={false} className="mx-auto max-w-xl p-6 text-center">
      <h3 className="text-base font-bold" style={{ color: "var(--color-text-h)" }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>{children}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}

function SkeletonBlock({ className = "", rounded = "rounded-lg" }) {
  return <div className={`animate-pulse ${rounded} ${className}`} style={{ background: "var(--color-surface-secondary)" }} />;
}

/* Mirrors the real layout so nothing jumps when data arrives. */
function SkillGapSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[19rem_1fr]" role="status" aria-busy="true">
      <span className="sr-only">Loading your skill gap</span>

      <div className="space-y-4">
        <Card hoverable={false} className="p-5">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="mt-2 h-5 w-40" />
          <div className="mt-4 flex items-center gap-5 lg:flex-col lg:gap-3">
            <SkeletonBlock rounded="rounded-full" className="h-28 w-28 shrink-0 lg:h-36 lg:w-36" />
            <div className="w-full space-y-2 lg:flex lg:flex-col lg:items-center">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-40" />
            </div>
          </div>
        </Card>
        <Card hoverable={false} className="p-5">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="mt-3 h-3 w-full" />
          <SkeletonBlock className="mt-2 h-3 w-4/5" />
        </Card>
      </div>

      <div>
        <div className="mb-3 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} rounded="rounded-full" className="h-7 w-20" />
          ))}
        </div>
        <Card hoverable={false} className="overflow-hidden p-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <SkeletonBlock className="h-4 w-28 shrink-0" />
              <SkeletonBlock rounded="rounded-full" className="h-2 flex-1" />
              <SkeletonBlock rounded="rounded-full" className="h-5 w-20 shrink-0" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */
export default function SkillGap() {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState("list"); // list | radar
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to retry loading

  useEffect(() => {
    let cancelled = false;

    skillGapApi
      .get()
      .then((res) => {
        if (cancelled) return;
        if (res && res.success && res.data) {
          setAnalysis(mapResponse(res.data));
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const isEmpty = status === "ready" && (!analysis.hasData || analysis.skills.length === 0);
  const showResults = status === "ready" && !isEmpty;

  const counts = useMemo(() => {
    const skills = showResults ? analysis.skills : [];
    return {
      all: skills.length,
      "needs-work": skills.filter((s) => s.status === "needs-work").length,
      close: skills.filter((s) => s.status === "close").length,
      "on-target": skills.filter((s) => s.status === "on-target").length,
    };
  }, [analysis, showResults]);

  const visibleSkills = useMemo(() => {
    if (!showResults) return [];
    return filter === "all" ? analysis.skills : analysis.skills.filter((s) => s.status === filter);
  }, [analysis, showResults, filter]);

  const startHere = showResults ? analysis.skills.find((s) => s.gap > 0) : null;

  const chartAvailable = showResults && analysis.skills.length >= 1;
  const activeView = chartAvailable ? view : "list";

  const verdict = showResults
    ? analysis.score >= 75
      ? "Strong foundation"
      : analysis.score >= 60
      ? "Getting there"
      : "Just getting started"
    : "";

  /* Performance-based order: a low overall score means the fundamentals
     come first (ConceptRoot); a higher score means targeted fixing (MistakeMap). */
  const conceptsFirst = showResults ? analysis.score < 60 : false;

  const nextSteps = [
    {
      id: "concepts",
      title: "Rebuild the concepts",
      body: startHere
        ? `Go back to the core ideas behind ${startHere.name}, your biggest gap.`
        : "Refresh the core ideas so your skills stay sharp.",
      cta: "Open ConceptRoot",
      to: ROUTES.concepts,
    },
    {
      id: "mistakes",
      title: "Learn from your mistakes",
      body: "See where your answers went wrong so you don't repeat the same errors.",
      cta: "Open MistakeMap",
      to: ROUTES.mistakes,
    },
  ];
  if (!conceptsFirst) nextSteps.reverse();

  /* Download = the browser's print dialog ("Save as PDF"), no extra library. */
  const handleDownload = () => window.print();

  /* Share a short text summary (the page itself is private to the user). */
  const handleShare = async () => {
    const focus = analysis.skills
      .filter((s) => s.status === "needs-work")
      .slice(0, 3)
      .map((s) => s.name);
    const text =
      `My AIFinity skill gap for ${analysis.goal}: ${analysis.score}/100.` +
      (focus.length ? ` Focus areas: ${focus.join(", ")}.` : " Every skill is on target.");
    const url = window.location.origin;

    try {
      if (navigator.share) {
        await navigator.share({ title: "My skill gap", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked — nothing to do.
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Print: hide site chrome so the PDF is just the report. */}
      <style>{`@media print { header, nav, footer { display: none !important; } }`}</style>

      {/* HERO */}
      <div className="print:hidden">
        <HeroSection
          variant="skill-gap"
          eyebrow="AIFinity AI · Skill Gap Analysis"
          title="Know exactly where you"
          highlightWord="stand — and what's next."
          description="Discover your exact proficiency level in any skill with AI-powered analysis. Get personalized insights into your strengths and the gaps you need to close for your target career role."
          primaryCta={{ label: "View My Skill Gap", href: "#skill-gap" }}
        />
      </div>

      <Section id="skill-gap" className="scroll-mt-20">
        {status === "loading" && <SkillGapSkeleton />}

        {status === "error" && (
          <Notice
            title="Couldn't load your skill gap"
            action={
              <button type="button" onClick={retry} className={LINK_BASE} style={LINK_PRIMARY_STYLE}>
                Try again
              </button>
            }
          >
            Check your connection and try again. If it keeps happening, log in again.
          </Notice>
        )}

        {isEmpty && (
          <Notice
            title="No skill data yet"
            action={
              <Link to={ROUTES.assessment} className={LINK_BASE} style={LINK_PRIMARY_STYLE}>
                Take an assessment
              </Link>
            }
          >
            Complete an assessment and your gaps for {analysis.goal} will show up here.
          </Notice>
        )}

        {showResults && (
          <>
            {/* Only visible in the printed PDF */}
            <div className="mx-auto mb-4 hidden max-w-6xl print:block">
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-h)" }}>
                Skill gap report: {analysis.goal}
              </h1>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[19rem_1fr]">
              {/* SIDEBAR: the answer in one glance */}
              <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start print:static">
                <Card hoverable={false} className="p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs" style={{ color: "var(--color-text-light)" }}>Target role</p>
                    <Link
                      to={ROUTES.onboarding}
                      className={`rounded text-xs font-semibold hover:underline print:hidden ${LINK_FOCUS}`}
                      style={{ color: "var(--color-primary-600)" }}
                    >
                      Change target role
                    </Link>
                  </div>
                  <h2
                    className="mt-0.5 text-lg font-bold leading-snug"
                    style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}
                  >
                    {analysis.goal}
                  </h2>

                  <div className="mt-4 flex items-center gap-5 lg:flex-col lg:gap-3 lg:text-center">
                    <ScoreRing score={analysis.score} />
                    <div>
                      <h3 className="text-base font-bold" style={{ color: "var(--color-text-h)" }}>{verdict}</h3>
                      <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                        {counts["needs-work"] > 0
                          ? `${counts["needs-work"]} of ${counts.all} skills need work.`
                          : "No skill is far from the target."}
                      </p>
                    </div>
                  </div>

                  <ProgressBlock progress={analysis.progress} />

                  <div className="mt-4 flex gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className={`${LINK_SM} flex-1`}
                      style={LINK_SECONDARY_STYLE}
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className={`${LINK_SM} flex-1`}
                      style={LINK_SECONDARY_STYLE}
                    >
                      {copied ? "Copied" : "Share"}
                    </button>
                  </div>
                </Card>

                <Card
                  hoverable={false}
                  className="p-5"
                  style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)" }}
                >
                  {startHere ? (
                    <>
                      <h3 className="text-sm font-bold" style={{ color: "var(--color-text-h)" }}>
                        Start with {startHere.name}
                      </h3>
                      <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                        Your biggest gap, {startHere.gap} points below target.
                        {startHere.estimate ? ` Estimated time to close it: ${startHere.estimate}.` : ""}{" "}
                        {startHere.recommendation}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold" style={{ color: "var(--color-text-h)" }}>
                        You meet every skill target
                      </h3>
                      <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                        Every skill is at or above the level {analysis.goal} needs.
                      </p>
                    </>
                  )}
                </Card>
              </aside>

              {/* MAIN */}
              <div className="min-w-0">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {activeView === "list" ? (
                    <div className="flex flex-wrap gap-1.5 print:hidden" role="group" aria-label="Filter skills">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setFilter(f.id);
                            setOpenId(null);
                          }}
                          aria-pressed={filter === f.id}
                          className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                          style={
                            filter === f.id
                              ? { background: "var(--color-primary-600)", color: "#fff" }
                              : { border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }
                          }
                        >
                          {f.label} <span className="tabular-nums opacity-80">{counts[f.id]}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <h3 className="text-sm font-bold" style={{ color: "var(--color-text-h)" }}>
                      Your skills at a glance
                    </h3>
                  )}

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Legend: explains the visuals once, so rows stay clean */}
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-5 rounded-full" style={{ background: "var(--color-primary-600)" }} />
                        Your level
                      </span>
                      <span className="flex items-center gap-1.5">
                        {activeView === "list" ? (
                          <span className="h-3 w-0.5 rounded-full" style={{ background: "var(--color-accent)" }} />
                        ) : (
                          <span className="w-5 border-t-2 border-dashed" style={{ borderColor: "var(--color-accent)" }} />
                        )}
                        Level needed
                      </span>
                    </div>

                    {chartAvailable && (
                      <div className="print:hidden">
                        <ViewToggle view={activeView} onChange={setView} />
                      </div>
                    )}
                  </div>
                </div>

                {activeView === "list" ? (
                  <Card hoverable={false} className="overflow-hidden p-0">
                    <div className="lg:max-h-[34rem] lg:overflow-y-auto print:max-h-none print:overflow-visible">
                      {visibleSkills.length > 0 ? (
                        visibleSkills.map((skill) => (
                          <SkillRow
                            key={skill.id}
                            skill={skill}
                            open={openId === skill.id}
                            onToggle={() => setOpenId(openId === skill.id ? null : skill.id)}
                          />
                        ))
                      ) : (
                        <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                          No skills in this group.
                        </p>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card hoverable={false} className="p-4 sm:p-6">
                    {analysis.skills.length < RADAR_MIN ? (
                      <ColumnChart skills={analysis.skills} />
                    ) : (
                      <>
                        {analysis.skills.length > RADAR_MAX && (
                          <p className="mb-2 text-center text-xs" style={{ color: "var(--color-text-light)" }}>
                            Showing your {RADAR_MAX} biggest gaps out of {analysis.skills.length} skills. Switch to List
                            to see all of them.
                          </p>
                        )}
                        {/* skills are already sorted by biggest gap first */}
                        <RadarChart skills={analysis.skills.slice(0, RADAR_MAX)} />
                      </>
                    )}
                  </Card>
                )}

                {/* NEXT STEPS: order depends on the user's overall score */}
                <section className="mt-8 print:hidden" aria-labelledby="next-steps-heading">
                  <h3 id="next-steps-heading" className="text-lg font-bold" style={{ color: "var(--color-text-h)" }}>
                    What to do next
                  </h3>
                  <p className="mb-4 mt-0.5 text-xs" style={{ color: "var(--color-text-light)" }}>
                    {conceptsFirst
                      ? `At ${analysis.score}/100 you're still building the basics, so start with the concepts.`
                      : `At ${analysis.score}/100 you have the basics, so focus on the mistakes holding you back.`}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {nextSteps.map((step, index) => (
                      <NextStepCard key={step.id} step={step} recommended={index === 0} />
                    ))}
                  </div>

                  <Card hoverable={false} className="mt-4 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: "var(--color-text-h)" }}>
                          Want a full plan?
                        </h4>
                        <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                          Get a step-by-step roadmap built from your skill gaps.
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Link to={ROUTES.roadmap} className={LINK_BASE} style={LINK_PRIMARY_STYLE}>
                          Build my roadmap
                        </Link>
                        <Link to={ROUTES.assessment} className={LINK_BASE} style={LINK_SECONDARY_STYLE}>
                          Retake assessment
                        </Link>
                      </div>
                    </div>
                  </Card>
                </section>
              </div>
            </div>
          </>
        )}
      </Section>
    </div>
  );
}