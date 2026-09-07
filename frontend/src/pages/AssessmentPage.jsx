import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import Button from "../components/Button";
import Calendar from "../components/Calendar";
import { ArrowRight } from "lucide-react";
import {
  TYPE_FILTERS,
  DIFFICULTY_FILTERS,
  getUserProfile,
  formatType,
} from "../utils/constants";
import { assessmentApi, dashboardApi } from "../services/api";

const ITEMS_PER_PAGE = 6;

/* ---------------- Category palette (gradient tiles + Quest-style cards) ---------------- */

const CATEGORY_GRADIENTS = [
  "from-[#2563eb] to-[#4f46e5]", // blue -> indigo
  "from-[#0d9488] to-[#059669]", // teal -> emerald (brand teal)
  "from-[#9333ea] to-[#c026d3]", // purple -> fuchsia
  "from-[#d97706] to-[#ea580c]", // amber -> orange (brand amber)
  "from-[#e11d48] to-[#db2777]", // rose -> pink
  "from-[#0891b2] to-[#2563eb]", // cyan -> blue
];

const CATEGORY_ICON_STYLES = [
  "bg-blue-50 text-blue-600",
  "bg-teal-50 text-teal-600",
  "bg-purple-50 text-purple-600",
  "bg-amber-50 text-amber-600",
  "bg-rose-50 text-rose-600",
  "bg-cyan-50 text-cyan-600",
];

// A small rotating set of generic outline icons for category tiles.
const CATEGORY_ICON_PATHS = [
  <path key="layers" d="M12 3l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  <>
    <ellipse key="db1" cx="12" cy="6" rx="7" ry="2.5" strokeWidth="1.6" />
    <path key="db2" d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" strokeWidth="1.6" />
    <path key="db3" d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" strokeWidth="1.6" />
  </>,
  <path key="pencil" d="M4 20l1-4L16 5l3 3L8 19l-4 1z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  <>
    <circle key="tg1" cx="12" cy="12" r="8" strokeWidth="1.6" />
    <circle key="tg2" cx="12" cy="12" r="4" strokeWidth="1.6" />
    <circle key="tg3" cx="12" cy="12" r="0.6" fill="currentColor" />
  </>,
  <path key="spark" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />,
  <path key="puzzle" d="M9 4h4v2.2a1.8 1.8 0 003.6 0V4H20v4.2a1.8 1.8 0 000 3.6V16h-4.2a1.8 1.8 0 00-3.6 0V20H8v-4.2a1.8 1.8 0 00-3.6 0H4V12h2.2a1.8 1.8 0 000-3.6H4V4h5z" strokeWidth="1.4" strokeLinejoin="round" />,
];

function getCategoryIndex(cat) {
  return Array.from(cat).reduce((hash, character) => hash + character.charCodeAt(0), 0) % CATEGORY_GRADIENTS.length;
}

/* ---------------- Left sidebar nav (LeetCode-style rail) ---------------- */

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <path d="M4 12l8-8 8 8M6 10v10h12V10" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    id: "categories",
    label: "Categories",
    icon: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" strokeWidth="1.6" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" strokeWidth="1.6" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" strokeWidth="1.6" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" strokeWidth="1.6" />
      </>
    ),
  },
  {
    id: "recommended",
    label: "Recommended",
    icon: (
      <path
        d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6L12 3z"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "daily",
    label: "Daily Challenge",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" strokeWidth="1.6" />
        <path d="M4 9h16M8 3v4M16 3v4" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "explore",
    label: "Explore",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" strokeWidth="1.6" />
        <path d="M20 20l-3.6-3.6" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
];

function SidebarNav({ active, open, onToggle }) {
  return (
    <nav className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-h)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 shrink-0">
          <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {open && <span className="text-sm font-medium">Menu</span>}
      </button>

      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            title={item.label}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
              ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-h)]"
              }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className={`h-5 w-5 shrink-0 ${isActive ? "text-[var(--color-primary-600)]" : "text-[var(--color-text-light)] group-hover:text-[var(--color-text-h)]"}`}
            >
              {item.icon}
            </svg>
            {open && <span>{item.label}</span>}
          </a>
        );
      })}
    </nav>
  );
}

/* ---------------- Assessment Progress Card ----------------
   Replaces the hardcoded 88% Mastery Skill Snapshot visual with real,
   data-driven user metrics from the backend. */
function AssessmentProgressCard({ completedCount, availableCount, inProgressCount, loading, className = "" }) {
  const hasCompleted = completedCount > 0;

  return (
    <div
      className={`relative flex flex-col items-center gap-5 rounded-2xl border border-[#2E4F42]/15 bg-[#FBF8F0] px-6 py-7 text-center shadow-[var(--shadow-card)] ${className}`}
    >
      <span className="font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.15em] text-[#C4952A]">
        Assessment Progress
      </span>

      <div className="flex flex-col items-center gap-1">
        <span className="font-sans text-4xl sm:text-5xl font-extrabold text-[#1B332C]">
          {loading ? "..." : completedCount}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B5F]">
          Assessments Completed
        </span>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 border-y border-[#2E4F42]/10 py-4">
        <div className="flex flex-col items-center rounded-xl bg-[#F1EDE1]/60 p-2.5">
          <span className="text-xl font-bold text-[#1B332C]">{loading ? "-" : completedCount}</span>
          <span className="text-[10px] font-medium text-[#5B6B5F]">Completed</span>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-[#F1EDE1]/60 p-2.5">
          <span className="text-xl font-bold text-[#1B332C]">{loading ? "-" : availableCount}</span>
          <span className="text-[10px] font-medium text-[#5B6B5F]">Available</span>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-[#F1EDE1]/60 p-2.5">
          <span className={`text-xl font-bold ${inProgressCount > 0 ? "text-[#C4952A]" : "text-[#1B332C]"}`}>
            {loading ? "-" : inProgressCount}
          </span>
          <span className="text-[10px] font-medium text-[#5B6B5F]">In Progress</span>
        </div>
      </div>

      <p className="max-w-[260px] text-xs leading-relaxed text-[#24413A]">
        {!hasCompleted
          ? "Complete an assessment to see your skill insights."
          : `Great progress! You have completed ${completedCount} unique assessment${completedCount === 1 ? "" : "s"}.`}
      </p>
    </div>
  );
}

/* One assessment, shown the same way in "Recommended" and "Explore".
   Gradient banner on top (colored per category, like LeetCode's Explore /
   Study Plan tiles) with a plain white footer for stats + CTA below. */
function AssessmentCard({ assessment }) {
  const questionTypes = useMemo(
    () => Array.from(new Set(assessment.questions.map((q) => q.type))),
    [assessment]
  );
  const gradient = CATEGORY_GRADIENTS[getCategoryIndex(assessment.category)];

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className={`relative flex aspect-[4/3] flex-col justify-between bg-gradient-to-br ${gradient} p-5 text-white`}>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
            {assessment.category}
          </span>
          <h3 className="mt-1 text-lg font-bold leading-snug">{assessment.title}</h3>
        </div>
        <div className="flex items-end justify-between">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${assessment.difficulty === "Easy"
              ? "bg-white/90 text-green-700"
              : assessment.difficulty === "Hard"
                ? "bg-white/90 text-red-700"
                : "bg-white/90 text-amber-700"
              }`}
          >
            {assessment.difficulty}
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-lg font-bold backdrop-blur-sm">
            {assessment.icon || "◆"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {assessment.description}
        </p>
        {assessment.recommendationReason && (
          <p className="mt-2 text-xs font-semibold text-[var(--color-primary-600)]">
            {assessment.recommendationReason}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <span>{assessment.questions.length} questions</span>
          <span>·</span>
          <span>~{assessment.duration} min</span>
          {questionTypes.slice(0, 2).map((t) => (
            <span key={t} className="rounded-md bg-[var(--color-surface-secondary)] px-2 py-0.5 font-medium">
              {formatType(t)}
            </span>
          ))}
        </div>
        <Button as={Link} to={`/assessment/${assessment.id}`} size="sm" className="mt-4 w-full">
          Start Assessment
        </Button>
      </div>
    </div>
  );
}

/* Quest-style category tile: colored icon chip + a dotted "level path" that
   communicates count, not fake progress (we don't track per-assessment
   completion, so every dot stays open/unfilled — same as LeetCode's own
   "0/35 Levels" untouched state). */
function CategoryTile({ category, count, index, isGenerating, onSelect }) {
  const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
  const iconStyle = CATEGORY_ICON_STYLES[index % CATEGORY_ICON_STYLES.length];
  const iconPath = CATEGORY_ICON_PATHS[index % CATEGORY_ICON_PATHS.length];
  const dotCount = Math.max(1, Math.min(count, 10));

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[var(--color-text-h)]">{category}</h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {count} assessment{count === 1 ? "" : "s"}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
            {iconPath}
          </svg>
        </span>
      </div>

      <div className="mt-5 flex items-center gap-1.5">
        {Array.from({ length: dotCount }).map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="h-px flex-1 bg-[var(--color-border)]" />}
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--color-border)] bg-white" />
          </React.Fragment>
        ))}
      </div>

      <button
        type="button"
        disabled={isGenerating}
        onClick={() => onSelect(category)}
        className={`mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${gradient} px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-75`}
      >
        {isGenerating ? (
          <>
            <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Generating AI...</span>
          </>
        ) : (
          <span>Start AI Practice</span>
        )}
      </button>
    </div>
  );
}

/* ---------------- Daily calendar (LeetCode-style) ---------------- */

/* Single day cell — number in a circle, tiny activity dot below.
   Today gets a filled circle; future days are dimmed; past days are all clickable. */
function DayCell({ daily, onDailyClick }) {
  const isFuture = daily.isFuture;
  const isCompleted = daily.status === "Completed";

  // Build YYYY-MM-DD for this day cell
  const now = new Date();
  const dateStr = daily.day
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(daily.day).padStart(2, "0")}`
    : null;

  const content = (
    <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
          daily.isToday && isCompleted
            ? "bg-green-500 text-white ring-2 ring-green-400 ring-offset-1 shadow-md shadow-green-300/50"
            : daily.isToday
              ? "bg-[var(--color-primary-600)] text-white shadow-md"
              : isCompleted
                ? "bg-green-500 text-white shadow-sm shadow-green-300/60"
                : isFuture
                  ? "text-[var(--color-text-light)] opacity-35"
                  : "text-[var(--color-text-h)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-600)] cursor-pointer"
        }`}
      >
        {isCompleted ? "✓" : daily.day}
      </span>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isCompleted
            ? "bg-green-400 shadow-sm shadow-green-400"
            : isFuture
              ? "bg-transparent"
              : "bg-[var(--color-primary-400)]"
        }`}
      />
    </div>
  );

  // Future days are not clickable yet
  if (isFuture) {
    return <div title={`Day ${daily.day} — upcoming`}>{content}</div>;
  }

  // Past and today: clicking generates a daily challenge for this specific date
  return (
    <div
      onClick={() => onDailyClick && onDailyClick(dateStr)}
      className="block cursor-pointer"
      title={isCompleted ? `Day ${daily.day} — Completed ✓` : `Day ${daily.day} — Click to start a challenge`}
    >
      {content}
    </div>
  );
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* Streak flame icon — used in the sidebar streak card. */
function FlameIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2c1 3-2.5 4.2-2.5 7.2 0 1.4 1 2.3 2 2.3.4-1.6-.4-2-.1-3.2C12.9 10 15 11.6 15 14.3c0 2.9-2.2 5.2-5 5.7-3.4-.4-6-3-6-6.3C4 9.9 7.3 7 9.2 5c-.4 1.3-.2 2 .5 2.5C9.4 5.6 10.3 3.6 12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---------------- Right sidebar: streak calendar + stats ---------------- */

function StreakSidebar({ profile, dailyAssessments, completedDays, onDailyClick }) {
  const now = new Date();
  const monthLabel = `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
  const firstWeekdayOffset = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = dailyAssessments.length - 1; i >= 0; i--) {
      const d = dailyAssessments[i];
      if (d.status === "Completed") streak++;
      else if (d.isToday) continue;
      else break;
    }
    return streak;
  }, [dailyAssessments]);

  const completionPct = dailyAssessments.length
    ? Math.round((completedDays / dailyAssessments.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Streak calendar card */}
      <div className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlameIcon className="h-5 w-5 text-amber-500" />
            <span className="text-lg font-bold text-[var(--color-text-h)]">
              {currentStreak} day{currentStreak === 1 ? "" : "s"}
            </span>
          </div>
          <span className="rounded-full border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary-600)]">
            {profile.field || "Not set"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          {monthLabel} · {completedDays}/{dailyAssessments.length} days completed
        </p>

        {/* Weekday header */}
        <div className="mt-4 grid grid-cols-7 text-center text-[11px] font-medium text-[var(--color-text-light)]">
          {WEEKDAY_LABELS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        {/* Day grid — leading blanks align "Day 1" to its real weekday */}
        <div className="mt-2 grid grid-cols-7 gap-y-2 text-center">
          {Array.from({ length: firstWeekdayOffset }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {dailyAssessments.map((daily) => (
            <DayCell key={daily.id} daily={daily} onDailyClick={onDailyClick} />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-400)]" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-light)] opacity-40" /> Upcoming
          </span>
        </div>
      </div>

      {/* Progress card */}
      <div className="border-t border-[var(--color-border)] pt-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-light)]">
          This month
        </span>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="var(--color-primary-600)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(completionPct / 100) * 97.4} 97.4`}
              />
            </svg>
            <span className="absolute text-sm font-bold text-[var(--color-text-h)]">
              {completionPct}%
            </span>
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">
            <p className="font-semibold text-[var(--color-text-h)]">{profile.careerGoal || "Not set"}</p>
            <p className="mt-0.5">{profile.skills.length} tracked skills</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [type, setType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [completedDailyDates, setCompletedDailyDates] = useState([]);
  const [loadError, setLoadError] = useState("");

  // AI Generation State
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiField, setAiField] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [aiCount, setAiCount] = useState(5);
  const [aiError, setAiError] = useState("");
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState(null);

  const [userStats, setUserStats] = useState({
    completedCount: 0,
    inProgressCount: 0,
    history: [],
    loading: true,
  });

  const profile = useMemo(() => getUserProfile(), []);

  useEffect(() => {
    let isMounted = true;

    assessmentApi.getPublished().then((result) => {
      if (!isMounted) return;
      if (result.success) setAssessments(result.assessments);
      else setLoadError(result.error || "Assessments could not be loaded.");
    });

    assessmentApi.getDailyStatus().then((result) => {
      if (!isMounted) return;
      if (result.success) setCompletedDailyDates(result.completedDates || []);
    });

    assessmentApi.getPersonalized().then((result) => {
      if (!isMounted) return;
      if (result.success) {
        setRecommended(result.assessments || []);
        setWeakTopics(result.weakTopics || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real user assessment metrics from backend
  useEffect(() => {
    let isMounted = true;

    const getInProgressCount = () => {
      if (typeof window === "undefined" || !window.sessionStorage) return 0;
      let count = 0;
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith("aifinity_active_attempt_")) {
          count++;
        }
      }
      return count;
    };

    const inProgress = getInProgressCount();

    dashboardApi
      .get()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && res.data) {
          const history = res.data.analytics?.assessments?.history || res.data.assessments || [];
          const uniqueCompleted = new Set(
            history.map((a) => String(a.assessmentId || a.id || a.name || a.title))
          );
          setUserStats({
            completedCount: uniqueCompleted.size,
            inProgressCount: inProgress,
            history,
            loading: false,
          });
        } else {
          setUserStats({
            completedCount: 0,
            inProgressCount: inProgress,
            history: [],
            loading: false,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setUserStats({
            completedCount: 0,
            inProgressCount: inProgress,
            history: [],
            loading: false,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const DEFAULT_TRACK_CATEGORIES = [
    "Frontend Development",
    "Data Structures & Algorithms",
    "Backend Development",
    "System Design",
    "Database Systems"
  ];

  const categories = useMemo(() => {
    const existingCats = assessments.map((assessment) => assessment.category).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_TRACK_CATEGORIES, ...existingCats]));
    return ["All", ...combined];
  }, [assessments]);
  
  // Removed static recommended logic since we fetch it from backend now

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    if (!aiField || !aiTopic) {
      setAiError("Please fill out Field and Topic.");
      return;
    }
    setIsAIGenerating(true);
    setAiError("");
    
    try {
      const res = await assessmentApi.generateAI({
        field: aiField,
        topic: aiTopic,
        difficulty: aiDifficulty,
        count: aiCount
      });
      if (res.success && res.assessmentId) {
        window.location.href = `/assessment/${res.assessmentId}`;
      } else {
        setAiError(res.error || res.message || "Failed to generate assessment.");
      }
    } catch (err) {
      setAiError("An error occurred. Please try again.");
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleCategorySelect = async (categoryName) => {
    setGeneratingCategory(categoryName);
    try {
      const userField = profile?.field || "Software Development";
      const res = await assessmentApi.generateAI({
        field: userField,
        topic: categoryName,
        difficulty: "Medium",
        count: 5
      });
      if (res.success && res.assessmentId) {
        window.location.href = `/assessment/${res.assessmentId}`;
      } else {
        alert(res.error || res.message || `Failed to generate AI assessment for ${categoryName}`);
      }
    } catch (err) {
      alert(`An error occurred while generating AI assessment for ${categoryName}`);
    } finally {
      setGeneratingCategory(null);
    }
  };

  const handleGenerateDaily = async (targetDate) => {
    setIsGeneratingDaily(true);
    try {
      const res = await assessmentApi.generateDailyAI(targetDate || undefined);
      if (res.success && res.assessmentId) {
        window.location.href = `/assessment/${res.assessmentId}`;
      } else {
        alert(res.error || res.message || "Failed to start daily challenge");
      }
    } catch (err) {
      alert("Error starting daily challenge");
    } finally {
      setIsGeneratingDaily(false);
    }
  };

  // Build a full-month day array so the Calendar sidebar shows every day, not just 3 assessments
  const dailyAssessments = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = completedDailyDates.includes(dateStr);
      // All days in the current month (past, today, and future) are Available.
      // Past days that were missed can still be completed retroactively.
      // Only future days beyond today are shown as upcoming (still Available).
      return {
        id: `day-${day}`,
        day,
        isToday: day === today,
        isFuture: day > today,
        title: `Day ${day}`,
        status: isCompleted ? "Completed" : "Available",
      };
    });
  }, [completedDailyDates]);

  const completedDays = dailyAssessments.filter((d) => d.status === "Completed").length;
  const todayDay = new Date().getDate();

  const todayAssessment = useMemo(
    () => dailyAssessments.find((d) => d.isToday),
    [dailyAssessments]
  );


  // Generate actual calendar for current month
  const monthlyCalendar = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const calendar = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push({ day: null, isPadding: true, isToday: false, status: "Locked" });
    }

    // Add all days of the month — all days are Available so users can
    // complete missed assessments from any day in the current month.
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = completedDailyDates.includes(dateStr);
      calendar.push({
        day,
        isPadding: false,
        isToday,
        isFuture: day > today,
        status: isCompleted ? "Completed" : "Available"
      });
    }

    return calendar;
  }, [completedDailyDates]);

  const weekDays = monthlyCalendar;

  const exploreList = useMemo(() => {
    return assessments.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (difficulty !== "All") {
        const matches = a.difficulty === difficulty || a.questions.some((q) => q.difficulty === difficulty);
        if (!matches) return false;
      }
      if (type !== "All" && !a.questions.some((q) => q.type === type)) return false;
      return true;
    });
  }, [assessments, category, difficulty, type]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, difficulty, type]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return exploreList.slice(start, end);
  }, [exploreList, currentPage]);

  const totalPages = Math.ceil(exploreList.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const sectionEls = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!sectionEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveSection(top.target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: "#F5F1E7",
        backgroundImage:
          "linear-gradient(rgba(90,74,58,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(90,74,58,0.14) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto flex items-start max-w-[1400px] gap-6 px-4 pb-16 lg:px-8">
        {/* ---------------- LEFT SIDEBAR ---------------- */}
        <aside
          className={`sticky top-[100px] hidden h-fit shrink-0 self-start pt-8 transition-all duration-200 md:block ${sidebarOpen ? "w-44" : "w-12"
            }`}
        >
          <SidebarNav active={activeSection} open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
        </aside>

        {/* ---------------- MAIN CONTENT ---------------- */}
        <div className="min-w-0 flex-1">
          {/* HEADER / HERO SECTION — two-column: pitch + live diagnostic preview */}
          <Section id="overview" className="scroll-mt-24 pt-8 pb-8 sm:pt-12 sm:pb-10">
            <div className="relative overflow-hidden rounded-3xl border border-[#2E4F42]/15 bg-[#FBF8F0] p-6 sm:p-8 lg:p-10 shadow-[var(--shadow-card)] transition-all duration-300">
              {/* Decorative top gold accent bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#D9A62B] via-[#E8C547] to-[#1B332C]" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* Left Column: Eyebrow, Heading, Description, CTA, Pillars & Context Cards */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  {/* Eyebrow badge */}
                  <span className="font-['Space_Mono'] text-xs font-bold uppercase tracking-[0.15em] text-[#C4952A] w-fit">
                    Skill Assessment Center
                  </span>

                  {/* Main Heading */}
                  <div>
                    <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1B332C] leading-[1.15]">
                      Test Your Skills. <br className="hidden sm:inline" />
                      <span className="text-[#C4952A]">Discover Your Strengths.</span>
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-[#24413A] leading-relaxed max-w-xl font-normal">
                      Take personalized assessments to measure your knowledge, identify skill gaps, and understand where you can improve.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-1">
                    <Button
                      as="a"
                      href="#recommended"
                      size="md"
                      className="inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      <span>Start Assessment</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Career Goal & Field — dynamic from profile, neutral fallback */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-[#2E4F42]/10 pt-4 text-sm">
                    <span className="text-[#5B6B5F]">
                      Career Goal <span className="ml-1.5 font-semibold text-[#1B332C]">{profile.careerGoal || "Not set"}</span>
                    </span>
                    <span className="text-[#5B6B5F]">
                      Field <span className="ml-1.5 font-semibold text-[#1B332C]">{profile.field || "Not set"}</span>
                    </span>
                  </div>
                </div>

                {/* Right Column: Assessment Diagnostic Preview Visual */}
                <div className="lg:col-span-5 w-full">
                  <AssessmentProgressCard
                    completedCount={userStats.completedCount}
                    availableCount={assessments.length}
                    inProgressCount={userStats.inProgressCount}
                    loading={userStats.loading}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* PRACTICE BY CATEGORY — Quest-style tiles */}
          <Section id="categories" className="scroll-mt-24">
            <SectionHeading
              title="Practice by Category"
              subtitle="Pick a track and work through it at your own pace."
            />
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {categories.filter((c) => c !== "All").map((c, i) => {
                const count = assessments.filter((a) => a.category === c).length;
                return (
                  <CategoryTile
                    key={c}
                    category={c}
                    count={count}
                    index={i}
                    isGenerating={generatingCategory === c}
                    onSelect={() => handleCategorySelect(c)}
                  />
                );
              })}
            </div>
          </Section>

          {/* MOBILE-ONLY: streak card sits inline since the right rail is hidden below xl */}
          <div className="mb-10 xl:hidden">
            <Calendar
              profile={profile}
              dailyAssessments={dailyAssessments}
              completedDays={completedDays}
              onDailyClick={handleGenerateDaily}
            />
          </div>

          {loadError && (
            <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {loadError}
            </div>
          )}

          {/* GENERATE AI ASSESSMENT */}
          <Section id="generate-ai" className="scroll-mt-24 mb-10">
            <SectionHeading
              title="Generate AI Assessment"
              subtitle="Generate customized multiple-choice questions on any topic using Gemini AI."
            />
            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <form onSubmit={handleGenerateAI} className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--color-text-h)]">Field</label>
                  <input
                    type="text"
                    required
                    value={aiField}
                    onChange={(e) => setAiField(e.target.value)}
                    placeholder="e.g., Backend Development"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--color-text-h)]">Topic / Technology</label>
                  <input
                    type="text"
                    required
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Node.js"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--color-text-h)]">Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--color-text-h)]">Number of Questions</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div className="col-span-full mt-2">
                  {aiError && <p className="mb-4 text-sm text-rose-600">{aiError}</p>}
                  <Button type="submit" disabled={isAIGenerating} className="w-full sm:w-auto">
                    {isAIGenerating ? "Generating with Gemini..." : "Generate AI Assessment"}
                  </Button>
                </div>
              </form>
            </div>
          </Section>

          {/* RECOMMENDED FOR YOU */}
          <Section id="recommended" className="scroll-mt-24">
            <SectionHeading
              title="Recommended for You"
              subtitle={`Recommended for your ${profile.careerGoal || "goal"} — based on your field (${profile.field || "Not set"}) and skills: ${profile.skills.join(", ")}.`}
            />
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {weakTopics.map((topic) => (
                <div key={`weak-${topic}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-amber-50 shadow-sm transition-shadow hover:shadow-md p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Needs Improvement</span>
                  <h3 className="mt-1 text-lg font-bold leading-snug text-amber-900">{topic}</h3>
                  <p className="mt-2 text-sm text-amber-800/80 mb-4">Your recent scores in this topic are below average. Practice with AI to improve.</p>
                  <Button onClick={() => handleCategorySelect(topic)} className="mt-auto w-full" variant="outline">
                    Generate AI Assessment &rarr;
                  </Button>
                </div>
              ))}
              {recommended.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
              {recommended.length === 0 && weakTopics.length === 0 && (
                <p className="col-span-full text-center text-sm text-[var(--color-text-muted)]">
                  No recommendations yet — complete onboarding to get personalized picks.
                </p>
              )}
            </div>
          </Section>

          {/* DAILY ASSESSMENT */}
          <Section id="daily" className="scroll-mt-24">
            <SectionHeading
              title="Daily Assessment"
              subtitle={`A fresh ${profile.field || "skill"} challenge, every day this month.`}
            />

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Today's challenge */}
              {todayAssessment ? (
                <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary-600)] to-[#d97706] p-6 text-white shadow-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    Day {todayDay} · {profile.field || "Not set"}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold leading-snug">{todayAssessment.title}</h3>
                  <p className="mt-2 max-w-md text-sm text-white/80">
                    Keep your streak alive — finish today's challenge before it locks tomorrow.
                  </p>
                  <Button
                    onClick={handleGenerateDaily}
                    disabled={isGeneratingDaily}
                    size="sm"
                    className="mt-6 !bg-white !text-[var(--color-text-h)] hover:!bg-white/90"
                  >
                    {isGeneratingDaily ? "Generating..." : "Start Today's Challenge"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
                  No challenge is scheduled for today — check back tomorrow.
                </div>
              )}

              {/* This month */}
              <div className="rounded-2xl border border-[var(--color-border)] p-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-light)]">
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <div className="mt-4">
                  <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <span key={day} className="text-xs font-semibold text-[var(--color-text-light)]">{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {weekDays.map((d, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center gap-1 ${!d.isPadding && !d.isFuture ? "cursor-pointer group" : ""}`}
                        onClick={() => {
                          if (!d.isPadding && !d.isFuture && d.day) {
                            const n = new Date();
                            const ds = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
                            handleGenerateDaily(ds);
                          }
                        }}
                        title={d.isPadding ? "" : d.isFuture ? "Future day" : d.status === "Completed" ? `Day ${d.day} — Completed` : `Day ${d.day} — Click to start challenge`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                            d.isPadding
                              ? "invisible"
                              : d.isToday && d.status === "Completed"
                                ? "bg-green-500 text-white ring-2 ring-green-400 ring-offset-1 shadow-md shadow-green-300/50"
                                : d.isToday
                                  ? "bg-[var(--color-primary-600)] text-white shadow-md"
                                  : d.status === "Completed"
                                    ? "bg-green-500 text-white shadow-sm shadow-green-300/60"
                                    : d.isFuture
                                      ? "text-[var(--color-text-light)] opacity-35"
                                      : "text-[var(--color-text-h)] group-hover:bg-[var(--color-primary-50)] group-hover:text-[var(--color-primary-600)]"
                          }`}
                        >
                          {d.status === "Completed" ? "✓" : d.day}
                        </span>
                        {!d.isPadding && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              d.status === "Completed"
                                ? "bg-green-400 shadow-sm shadow-green-400"
                                : d.isFuture
                                  ? "bg-transparent"
                                  : "bg-[var(--color-primary-400)]"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* EXPLORE ASSESSMENTS */}
          <Section id="explore" className="scroll-mt-24">
            <SectionHeading
              title="Explore Assessments"
              subtitle="Browse across every field — new ones are added as you progress."
            />

            <div className="mt-8 space-y-4">
              {/* Category filter */}
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-light)]">
                  Category
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${category === c
                        ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-300)]"
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty + Type filters */}
              <div className="flex flex-wrap gap-8">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-light)]">
                    Difficulty
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTY_FILTERS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${difficulty === d
                          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-300)]"
                          }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-light)]">
                    Type
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_FILTERS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${type === t
                          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-300)]"
                          }`}
                      >
                        {t === "All" ? "All" : formatType(t)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedList.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
              {paginatedList.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
                  <p className="text-sm font-medium text-[var(--color-text-h)]">No public assessments match these filters yet.</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Use the AI Generator above to create a customized assessment!</p>
                  <Button onClick={() => handleCategorySelect(category === "All" ? "Node.js" : category)} className="mt-6" variant="outline">
                    Generate AI Assessment
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination - Load More button */}
            {totalPages > 1 && currentPage < totalPages && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  variant="outline"
                  size="md"
                >
                  Load More Assessments ({currentPage} of {totalPages})
                </Button>
              </div>
            )}

            {currentPage === totalPages && exploreList.length > 0 && (
              <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
                Showing all {exploreList.length} assessments
              </p>
            )}
          </Section>
        </div>

        {/* ---------------- RIGHT SIDEBAR (streak calendar) ---------------- */}
        <aside className="sticky top-20 hidden h-fit w-64 shrink-0 self-start pt-14 xl:block">
          <Calendar
            profile={profile}
            dailyAssessments={dailyAssessments}
            completedDays={completedDays}
            onDailyClick={handleGenerateDaily}
          />
        </aside>
      </div>
    </div>
  );
}
