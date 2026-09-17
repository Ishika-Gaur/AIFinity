import React from "react";
import { Link } from "react-router-dom";

export default function AIInsightCard({ aiInsight }) {
  const {
    title = "🧠 AI LEARNING INTELLIGENCE",
    observation = "Complete assessments to generate personalized AI insights based on your learning patterns.",
    recommendationTitle = "RECOMMENDED NEXT STEP",
    recommendation = "Take an assessment to pinpoint concepts needing practice.",
    cta = "Take Assessment",
    href = "/assessment",
  } = aiInsight || {};

  // If observation is multi-line string (like our updated AI Intelligence), render it nicely
  const obsLines = observation.split("\n").filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1B332C] p-6 sm:p-8 text-[#FBF8F0] shadow-[var(--shadow-card-hover)] border border-[#C4952A]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-6 group">
      {/* Background Chalk Dust Glow Accent */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#E8C547]/10 blur-2xl pointer-events-none group-hover:bg-[#E8C547]/20 transition-all duration-500" />

      {/* Card Header & Badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-lg bg-[#C4952A]/20 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[#E8C547] border border-[#E8C547]/30">
          <span>{title}</span>
        </div>
        <span className="font-mono text-[11px] text-[#8B9690]">
          Personalized
        </span>
      </div>

      {/* Core AI Observation */}
      <div className="flex flex-col gap-2">
        {obsLines.length > 1 ? (
           <ul className="flex flex-col gap-2">
             {obsLines.map((line, idx) => {
               const [label, ...valArr] = line.split(":");
               const val = valArr.join(":");
               return (
                 <li key={idx} className="font-sans text-sm sm:text-base font-semibold text-[#E8C547] group-hover:text-[#FBF8F0] transition-colors duration-200 border-b border-[#2E4F42]/30 pb-2 last:border-0 last:pb-0">
                    <span className="text-[#8B9690] text-xs uppercase tracking-wider block mb-0.5">{label.trim()}</span>
                    <span>{val ? val.trim() : line}</span>
                 </li>
               )
             })}
           </ul>
        ) : (
          <p className="font-sans text-base sm:text-lg font-semibold text-[#E8C547] leading-relaxed group-hover:text-[#FBF8F0] transition-colors duration-200">
            "{observation}"
          </p>
        )}
      </div>

      {/* Recommended Action Box */}
      <div className="rounded-xl bg-[#2E4F42]/60 p-4 border border-[#E8C547]/20 flex flex-col gap-1 group-hover:border-[#E8C547]/40 transition-colors duration-200">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#E8C547]">
          {recommendationTitle}
        </span>
        <p className="text-sm text-[#FBF8F0]/90 font-normal leading-relaxed">
          {recommendation}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-[#2E4F42]/50">
        <span className="text-xs text-[#8B9690] font-mono">
          Confidence: 94%
        </span>
        <Link to={href} className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 ease-out bg-[#E8C547] text-[#1B332C] hover:bg-[#C4952A] hover:text-white shadow-xs px-4 py-2 text-xs group-hover:scale-105 transition-transform cursor-pointer relative z-10">
          {cta} →
        </Link>
      </div>
    </div>
  );
}
