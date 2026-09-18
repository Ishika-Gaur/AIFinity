import React, { useMemo, useState } from "react";

const RANGES = [
  { key: "7D", label: "7 DAYS" },
  { key: "30D", label: "30 DAYS" },
  { key: "3M", label: "3 MONTHS" },
];

// Chart geometry (SVG user units — scales to any container width)
const W = 800;
const H = 280;
const PAD = { top: 24, right: 20, bottom: 34, left: 44 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/**
 * Accepts loosely-shaped API points and normalises them to { label, value }.
 * Tolerates value / accuracy / score and label / day / date keys.
 */
function normalise(points = []) {
  return points
    .filter(Boolean)
    .map((p) => ({
      label: String(p.label ?? p.day ?? p.date ?? ""),
      value: Number(p.value ?? p.accuracy ?? p.score ?? 0),
    }))
    .map((p) => ({ ...p, value: Number.isFinite(p.value) ? p.value : 0 }));
}

export default function LearningProgressChart({ seriesData = {} }) {
  const [range, setRange] = useState("7D");
  const [hovered, setHovered] = useState(null);

  const data = useMemo(() => normalise(seriesData[range]), [seriesData, range]);

  const { avg, peak, peakLabel, trend } = useMemo(() => {
    if (!data.length) return { avg: 0, peak: 0, peakLabel: "—", trend: null };
    const total = data.reduce((s, p) => s + p.value, 0);
    const best = data.reduce((a, b) => (b.value > a.value ? b : a));
    return {
      avg: Math.round(total / data.length),
      peak: best.value,
      peakLabel: best.label || "—",
      trend:
        data.length >= 2
          ? Math.round(data[data.length - 1].value - data[data.length - 2].value)
          : null,
    };
  }, [data]);

  // Map a point index + value to SVG coordinates
  const x = (i) => (data.length === 1 ? PAD.left + PLOT_W / 2 : PAD.left + (i * PLOT_W) / (data.length - 1));
  const y = (v) => PAD.top + PLOT_H - (Math.min(Math.max(v, 0), 100) / 100) * PLOT_H;

  const linePath = data.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const areaPath = data.length >= 2
    ? `${linePath} L ${x(data.length - 1)} ${PAD.top + PLOT_H} L ${x(0)} ${PAD.top + PLOT_H} Z`
    : "";

  const allZero = data.length > 0 && data.every((p) => p.value === 0);

  return (
    <div className="rounded-2xl bg-[#FBF8F0] p-6 border border-[#2E4F42]/12 shadow-[var(--shadow-card)] flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#1B332C]">
            Your Learning Progress
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6B5F] mt-0.5">
            Accuracy across your completed assessments
          </p>
        </div>

        <div className="flex gap-1 rounded-xl bg-[#EDE6D3] p-1 self-start">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                range === r.key
                  ? "bg-[#1B332C] text-[#E8C547]"
                  : "text-[#5B6B5F] hover:text-[#1B332C]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart / low-data states */}
      {data.length === 0 ? (
        <Notice
          emoji="📊"
          title="No data for this range"
          body="Complete an assessment in this period and your accuracy will appear here."
        />
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
            <defs>
              <linearGradient id="lpc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4952A" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#C4952A" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines + Y labels */}
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="#2E4F42"
                  strokeOpacity={tick === 0 ? 0.35 : 0.12}
                  strokeDasharray={tick === 0 ? "0" : "4 5"}
                />
                <text
                  x={PAD.left - 10}
                  y={y(tick) + 4}
                  textAnchor="end"
                  className="fill-[#5B6B5F]"
                  fontSize="12"
                >
                  {tick}%
                </text>
              </g>
            ))}

            {/* Area + line (only meaningful with 2+ points) */}
            {data.length >= 2 && (
              <>
                <path d={areaPath} fill="url(#lpc-fill)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#C4952A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Points */}
            {data.map((p, i) => (
              <g
                key={`${p.label}-${i}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Generous invisible hit area */}
                <rect
                  x={x(i) - 18}
                  y={PAD.top}
                  width="36"
                  height={PLOT_H}
                  fill="transparent"
                />
                {hovered === i && (
                  <line
                    x1={x(i)}
                    x2={x(i)}
                    y1={PAD.top}
                    y2={PAD.top + PLOT_H}
                    stroke="#1B332C"
                    strokeOpacity="0.25"
                  />
                )}
                <circle
                  cx={x(i)}
                  cy={y(p.value)}
                  r={hovered === i ? 7 : 5}
                  fill="#FBF8F0"
                  stroke="#C4952A"
                  strokeWidth="3"
                />
                {/* Value label — always shown when points are few, else on hover */}
                {(data.length <= 8 || hovered === i) && (
                  <text
                    x={x(i)}
                    y={y(p.value) - 14}
                    textAnchor="middle"
                    className="fill-[#1B332C]"
                    fontSize="12"
                    fontWeight="700"
                  >
                    {p.value}%
                  </text>
                )}
                {/* X label — thin out when crowded */}
                {(data.length <= 10 || i % Math.ceil(data.length / 8) === 0) && (
                  <text
                    x={x(i)}
                    y={PAD.top + PLOT_H + 22}
                    textAnchor="middle"
                    className="fill-[#5B6B5F]"
                    fontSize="12"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Honest messaging instead of a misleading flat line */}
          {data.length === 1 && (
            <p className="text-center text-xs text-[#5B6B5F] -mt-2">
              Only one assessment in this range — complete one more to see a trend line.
            </p>
          )}
          {data.length >= 2 && allZero && (
            <p className="text-center text-xs text-[#5B6B5F] -mt-2">
              All scores are 0% so far. Retry these assessments to start moving the line up.
            </p>
          )}
        </div>
      )}

      {/* Footer stats */}
      {data.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[#2E4F42]/10 pt-4">
          <Stat label="Average accuracy" value={`${avg}%`} />
          <Stat label="Best score" value={`${peak}% (${peakLabel})`} />
          <Stat label="Assessments" value={data.length} />
          {trend !== null && (
            <Stat
              label="Since last"
              value={`${trend > 0 ? "▲ +" : trend < 0 ? "▼ " : "— "}${trend !== 0 ? Math.abs(trend) + "%" : "no change"}`}
              tone={trend > 0 ? "up" : trend < 0 ? "down" : "flat"}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "flat" }) {
  const toneClass =
    tone === "up" ? "text-[#2E7D5B]" : tone === "down" ? "text-[#C1443C]" : "text-[#1B332C]";
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-[#5B6B5F]">{label}</span>
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
    </div>
  );
}

function Notice({ emoji, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-[#F1EDE1]/60 border border-[#2E4F42]/10 p-10 gap-2 min-h-[200px]">
      <span className="text-4xl">{emoji}</span>
      <p className="font-sans text-lg font-bold text-[#1B332C]">{title}</p>
      <p className="text-sm text-[#5B6B5F] text-center max-w-xs">{body}</p>
    </div>
  );
}