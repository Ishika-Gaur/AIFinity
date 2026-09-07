import React, { useMemo } from "react";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

/* Streak flame icon — used in the calendar card. */
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

/* Reusable Calendar Component */
export default function Calendar({ 
  streak, 
  profile, 
  dailyAssessments, 
  completedDays,
  showProgress = true,
  onDailyClick,
}) {
  const now = new Date();
  const monthLabel = `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
  const firstWeekdayOffset = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const currentStreak = useMemo(() => {
    if (streak !== undefined) return streak;
    let calculatedStreak = 0;
    for (let i = dailyAssessments.length - 1; i >= 0; i--) {
      const d = dailyAssessments[i];
      if (d.status === "Completed") calculatedStreak++;
      else if (d.isToday) continue;
      else break;
    }
    return calculatedStreak;
  }, [dailyAssessments, streak]);

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
          {profile?.field && (
            <span className="rounded-full border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary-600)]">
              {profile.field}
            </span>
          )}
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
      {showProgress && (
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
              <p className="font-semibold text-[var(--color-text-h)]">{profile?.careerGoal || "Not set"}</p>
              <p className="mt-0.5">{profile?.skills?.length || 0} tracked skills</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
