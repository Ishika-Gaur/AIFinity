import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function LearningProgressChart({ seriesData }) {
  const safeSeries = seriesData || {};

  // Pick the timeframe that actually has assessment data by default
  const [timeframe, setTimeframe] = useState(() => {
    if (safeSeries["7D"]?.length > 0) return "7D";
    if (safeSeries["30D"]?.length > 0) return "30D";
    if (safeSeries["3M"]?.length > 0) return "3M";
    return "7D";
  });

  const [activePoint, setActivePoint] = useState(null);

  const rawData = safeSeries[timeframe] || [];
  // Ensure each entry has a valid numeric score
  const data = rawData.filter((item) => typeof item.score === "number" && !isNaN(item.score));
  
  const maxScore = 100;
  const minScore = 0;

  // Compute SVG coordinates for the line/bar chart
  const chartHeight = 190;
  const chartWidth = 500;
  const paddingX = 45;
  const paddingY = 25;

  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingY * 2;

  const points = data.map((item, index) => {
    const x =
      paddingX +
      (data.length > 1
        ? (index / (data.length - 1)) * availableWidth
        : availableWidth / 2);
    const y =
      chartHeight -
      paddingY -
      ((item.score - minScore) / (maxScore - minScore)) * availableHeight;
    return { x, y, label: item.day, score: item.score };
  });

  // SVG Line path: If 1 point, draw horizontal benchmark line across canvas; if multiple, connect them
  const pathD =
    points.length === 1
      ? `M ${paddingX} ${points[0].y} L ${chartWidth - paddingX} ${points[0].y}`
      : points.length > 1
      ? points.reduce((acc, point, index) => {
          return index === 0
            ? `M ${point.x} ${point.y}`
            : `${acc} L ${point.x} ${point.y}`;
        }, "")
      : "";

  // Area path underneath line
  const areaD =
    points.length === 1
      ? `M ${paddingX} ${points[0].y} L ${chartWidth - paddingX} ${points[0].y} L ${chartWidth - paddingX} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`
      : points.length > 1
      ? `${pathD} L ${points[points.length - 1]?.x || 0} ${chartHeight - paddingY} L ${points[0]?.x || 0} ${chartHeight - paddingY} Z`
      : "";

  // Compute average score for the selected timeframe
  const avgScore = data.length > 0
    ? Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length)
    : 0;

  // Find max score item
  const maxItem = data.length > 0 ? [...data].sort((a, b) => b.score - a.score)[0] : null;

  return (
    <div className="rounded-2xl bg-[#FBF8F0] p-6 sm:p-8 border border-[#2E4F42]/12 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 flex flex-col gap-6">
      {/* Chart Top Header & Timeframe Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#1B332C]">
            YOUR LEARNING PROGRESS
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6B5F] font-normal mt-0.5">
            Accuracy & performance evolution over time
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 rounded-xl bg-[#EDE6D3] p-1 border border-[#2E4F42]/10 w-fit">
          {[
            { id: "7D", label: "7 DAYS", count: safeSeries["7D"]?.length || 0 },
            { id: "30D", label: "30 DAYS", count: safeSeries["30D"]?.length || 0 },
            { id: "3M", label: "3 MONTHS", count: safeSeries["3M"]?.length || 0 },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => {
                setTimeframe(tf.id);
                setActivePoint(null);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                timeframe === tf.id
                  ? "bg-[#1B332C] text-[#E8C547] shadow-xs"
                  : "text-[#5B6B5F] hover:text-[#1B332C] hover:bg-[#F1EDE1]"
              }`}
            >
              {tf.label}
              {tf.count > 0 && timeframe !== tf.id && (
                <span className="ml-1.5 h-1.5 w-1.5 inline-block rounded-full bg-[#C4952A]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Chart Canvas */}
      <div className="relative w-full overflow-visible rounded-xl bg-[#F1EDE1]/50 p-4 border border-[#2E4F42]/08 min-h-[220px]">
        {data.length === 0 ? (
          /* Empty state for specific timeframe */
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <span className="text-3xl">📊</span>
            <p className="font-sans font-bold text-[#1B332C]">No assessments in this timeframe</p>
            <p className="text-xs text-[#5B6B5F] max-w-xs">
              Take an assessment to record your progress, or select another timeframe above.
            </p>
            <Link
              to="/assessment"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] px-3.5 py-1.5 text-xs font-bold text-[#E8C547] hover:bg-[#2E4F42] transition-colors"
            >
              Take Assessment →
            </Link>
          </div>
        ) : (
          <>
            {/* Floating Tooltip when point is hovered */}
            {activePoint && (
              <div
                className="absolute z-30 pointer-events-none rounded-xl bg-[#1B332C] px-3.5 py-2 text-white shadow-md border border-[#E8C547]/40 -translate-x-1/2 -translate-y-full transition-all duration-150"
                style={{
                  left: `${(activePoint.x / chartWidth) * 100}%`,
                  top: `${(activePoint.y / chartHeight) * 100 - 8}%`,
                }}
              >
                <div className="font-mono text-[10px] uppercase text-[#E8C547]">
                  {activePoint.label}
                </div>
                <div className="font-sans text-sm font-bold text-white">
                  {activePoint.score}% Accuracy
                </div>
              </div>
            )}

            {/* Y-Axis Label Indicators */}
            <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between text-[10px] font-mono text-[#8B9690] pointer-events-none">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Grid lines background */}
            <div className="absolute inset-x-10 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-25">
              <div className="border-b border-dashed border-[#1B332C]" />
              <div className="border-b border-dashed border-[#1B332C]" />
              <div className="border-b border-dashed border-[#1B332C]" />
              <div className="border-b border-dashed border-[#1B332C]" />
              <div className="border-b border-dashed border-[#1B332C]" />
            </div>

            {/* SVG Chart Graphic */}
            <div className="pl-6">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-48 overflow-visible"
                onMouseLeave={() => setActivePoint(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D9A62B" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#D9A62B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Filled area under curve */}
                {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                {/* Main connecting line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#C4952A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data point dots & hover interactions */}
                {points.map((pt, i) => {
                  const isHovered = activePoint?.label === pt.label;
                  return (
                    <g
                      key={i}
                      className="cursor-pointer"
                      onMouseEnter={() => setActivePoint(pt)}
                    >
                      {/* Vertical dash line on hover */}
                      <line
                        x1={pt.x}
                        y1={paddingY}
                        x2={pt.x}
                        y2={chartHeight - paddingY}
                        stroke="#1B332C"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        className={`transition-opacity duration-200 ${
                          isHovered ? "opacity-60" : "opacity-0"
                        }`}
                      />

                      {/* Outer ring */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "8" : "6"}
                        fill="#FBF8F0"
                        stroke="#1B332C"
                        strokeWidth="2"
                        className="transition-all duration-200"
                      />

                      {/* Inner dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "4.5" : "3"}
                        fill={isHovered ? "#E8C547" : "#D9A62B"}
                        className="transition-all duration-200"
                      />

                      {/* Static score label above point if 1-3 points */}
                      {points.length <= 3 && (
                        <text
                          x={pt.x}
                          y={pt.y - 12}
                          textAnchor="middle"
                          fill="#1B332C"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {pt.score}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* X-Axis labels */}
              <div className="mt-2 flex justify-between px-2 font-['Space_Mono'] text-xs text-[#5B6B5F]">
                {points.map((pt, i) => {
                  const isHovered = activePoint?.label === pt.label;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setActivePoint(pt)}
                      className={`cursor-pointer transition-all duration-200 ${
                        isHovered
                          ? "text-[#1B332C] font-bold underline decoration-[#D9A62B] decoration-2"
                          : "hover:text-[#1B332C]"
                      }`}
                    >
                      {pt.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart Footer summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#2E4F42]/10 text-xs">
        <div className="flex items-center gap-2 font-['Space_Mono'] text-[#5B6B5F]">
          <span className="h-2 w-2 rounded-full bg-[#D9A62B]" />
          {data.length > 0 ? (
            <span>
              Average Accuracy: <strong className="text-[#1B332C] font-semibold">{avgScore}%</strong>
            </span>
          ) : (
            <span>No assessments recorded in this timeframe</span>
          )}
        </div>
        {maxItem && (
          <div className="flex items-center gap-2 font-['Space_Mono'] text-[#2E4F42]">
            <span>Peak Performance: <strong className="text-[#1B332C] font-semibold">{maxItem.score}% ({maxItem.day})</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
