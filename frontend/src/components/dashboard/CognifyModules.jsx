import React from "react";
import { Link } from "react-router-dom";
import Button from "../Button";

export default function CognifyModules({ conceptRoot, mistakeMap, skillGap }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "strong":
        return { icon: "✓", color: "text-[#2E4F42] bg-[#2E4F42]/10 border-[#2E4F42]/30" };
      case "improving":
        return { icon: "~", color: "text-[#C4952A] bg-[#E8C547]/20 border-[#C4952A]/40" };
      case "attention":
        return { icon: "×", color: "text-[#C1443C] bg-[#C1443C]/10 border-[#C1443C]/30" };
      default:
        return { icon: "•", color: "text-[#5B6B5F] bg-[#EDE6D3] border-[#2E4F42]/10" };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Module 1: ConceptRoot AI */}
      <div className="flex flex-col justify-between rounded-2xl bg-[#FBF8F0] p-6 sm:p-7 border border-[#2E4F42]/12 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:border-[#C4952A]/40 hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C4952A] bg-[#EDE6D3] px-2.5 py-0.5 rounded-md">
              ROOT CAUSE
            </span>
            <span className="text-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🌳</span>
          </div>

          <div>
            <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#1B332C] group-hover:text-[#C4952A] transition-colors">
              {conceptRoot?.title || "ConceptRoot AI"}
            </h3>
            <p className="text-xs text-[#5B6B5F] font-normal leading-relaxed mt-1">
              {conceptRoot?.description || "Understand why you're getting questions wrong."}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F1EDE1] p-3 border border-[#2E4F42]/08 text-center font-mono">
            <div>
              <span className="block text-[10px] text-[#8B9690] uppercase font-semibold">Analyzed</span>
              <span className="text-base font-extrabold text-[#1B332C]">
                {conceptRoot?.metrics?.analyzed ?? 0}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#2E4F42] uppercase font-semibold">Strong</span>
              <span className="text-base font-extrabold text-[#2E4F42]">
                {conceptRoot?.metrics?.strong ?? 0}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#C1443C] uppercase font-semibold">Attention</span>
              <span className="text-base font-extrabold text-[#C1443C]">
                {conceptRoot?.metrics?.needsAttention ?? 0}
              </span>
            </div>
          </div>

          {/* Concept items list */}
          <div className="flex flex-col gap-2 pt-1">
            {conceptRoot?.concepts?.map((c, i) => {
              const badge = getStatusBadge(c.status);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-[#2E4F42]/10 last:border-0"
                >
                  <span className="font-medium text-[#24413A]">{c.name}</span>
                  <span
                    className={`inline-flex items-center justify-center h-5 w-5 rounded-full font-mono font-bold text-xs border ${badge.color}`}
                  >
                    {badge.icon}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-5 mt-4 border-t border-[#2E4F42]/10">
          <Link
            to={conceptRoot?.href || "/concept-root"}
            className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 bg-[var(--color-surface)] text-[#1B332C] border border-[#2E4F42]/20 hover:bg-[#1B332C] hover:text-[#E8C547] hover:border-[#1B332C] px-4 py-2 text-xs w-full justify-between shadow-2xs"
          >
            <span>{conceptRoot?.cta || "Explore ConceptRoot"}</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Module 2: MistakeMap AI */}
      <div className="flex flex-col justify-between rounded-2xl bg-[#FBF8F0] p-6 sm:p-7 border border-[#2E4F42]/12 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:border-[#C1443C]/40 hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C1443C] bg-[#C1443C]/10 px-2.5 py-0.5 rounded-md">
              PATTERN DETECTION
            </span>
            <span className="text-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🗺️</span>
          </div>

          <div>
            <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#1B332C] group-hover:text-[#C1443C] transition-colors">
              {mistakeMap?.title || "MistakeMap AI"}
            </h3>
            <p className="text-xs text-[#5B6B5F] font-normal leading-relaxed mt-1">
              {mistakeMap?.description || "Discover the patterns behind your mistakes."}
            </p>
          </div>

          {/* Most Common Mistake Featured Card */}
          <div className="rounded-xl bg-[#F1EDE1] p-4 border border-[#2E4F42]/08 flex flex-col gap-2.5 group-hover:border-[#C1443C]/20 transition-colors">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5B6B5F]">
              MOST COMMON MISTAKE
            </span>
            <span className="font-sans text-base font-bold text-[#C1443C]">
              "{mistakeMap?.mostCommonMistake || "No recurring errors detected"}"
            </span>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#2E4F42]/10 font-mono">
              <span className="text-[#5B6B5F]">
                {mistakeMap?.occurrences ?? 0} occurrences
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#2E4F42]">
                <svg className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +{mistakeMap?.improvement ?? 0}% improvement
              </span>
            </div>
          </div>
        </div>

        <div className="pt-5 mt-4 border-t border-[#2E4F42]/10">
          <Link
            to={mistakeMap?.href || "/mistake-map"}
            className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 bg-[var(--color-surface)] text-[#1B332C] border border-[#2E4F42]/20 hover:bg-[#1B332C] hover:text-[#E8C547] hover:border-[#1B332C] px-4 py-2 text-xs w-full justify-between shadow-2xs"
          >
            <span>{mistakeMap?.cta || "View MistakeMap"}</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Module 3: SkillGap AI */}
      <div className="flex flex-col justify-between rounded-2xl bg-[#FBF8F0] p-6 sm:p-7 border border-[#2E4F42]/12 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:border-[#1B332C]/40 hover:-translate-y-1 transition-all duration-300 group">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2E4F42] bg-[#2E4F42]/10 px-2.5 py-0.5 rounded-md">
              CAREER READINESS
            </span>
            <span className="text-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🎯</span>
          </div>

          <div>
            <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#1B332C] group-hover:text-[#2E4F42] transition-colors">
              {skillGap?.title || "SkillGap AI"}
            </h3>
            <p className="text-xs text-[#5B6B5F] font-normal leading-relaxed mt-1">
              {skillGap?.description || "See how your current skills compare with your career goal."}
            </p>
          </div>

          {/* Target Career & Match % */}
          <div className="rounded-xl bg-[#1B332C] p-4 text-[#FBF8F0] flex items-center justify-between border border-[#C4952A]/30 shadow-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#E8C547] block font-bold">
                TARGET CAREER
              </span>
              <span className="font-sans text-sm font-bold text-[#FBF8F0] block mt-0.5">
                {skillGap?.targetCareer || "Set your career goal"}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] uppercase text-[#8B9690] block font-bold">
                MATCH
              </span>
              <span className="font-sans text-2xl font-extrabold text-[#E8C547]">
                {skillGap?.matchPercentage ?? 0}%
              </span>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="flex flex-col gap-1.5 pt-1">
            {skillGap?.skills?.map((s, i) => {
              const badge = getStatusBadge(s.status);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-[#2E4F42]/10 last:border-0"
                >
                  <span className="font-medium text-[#24413A]">{s.name}</span>
                  <span
                    className={`inline-flex items-center justify-center h-5 w-5 rounded-full font-mono font-bold text-xs border ${badge.color}`}
                  >
                    {badge.icon}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-5 mt-4 border-t border-[#2E4F42]/10">
          <Link
            to={skillGap?.href || "/skill-gap"}
            className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 bg-[var(--color-surface)] text-[#1B332C] border border-[#2E4F42]/20 hover:bg-[#1B332C] hover:text-[#E8C547] hover:border-[#1B332C] px-4 py-2 text-xs w-full justify-between shadow-2xs"
          >
            <span>{skillGap?.cta || "View Skill Gap"}</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
