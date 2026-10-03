import React, { useState } from "react";
import {
  BADGE_DEFINITIONS,
  CERTIFICATE_DEFINITIONS,
  computeAchievementStats,
} from "./achievementData";

// ─────────────────────────────────────────────────────────────────
// Certificate Preview Modal
// ─────────────────────────────────────────────────────────────────
function CertModal({ cert, userName, onClose }) {
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "#FFFDF7" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-8 py-8 text-white text-center overflow-hidden" style={{ background: cert.gradient }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 text-4xl mb-3">
              {cert.emoji}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-70 mb-1">Certificate of Achievement</p>
            <h2 className="text-2xl font-black">{cert.name}</h2>
            <p className="text-sm opacity-75 mt-1 font-medium">{cert.subtitle}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          <div className="text-center mb-6">
            <p className="text-xs text-[#9CA3AF] uppercase tracking-widest mb-2">This is to certify that</p>
            <p className="text-2xl font-black text-[#1B332C]">{userName || "Learner"}</p>
            <p className="text-sm text-[#5B6B5F] mt-2 leading-relaxed">{cert.description}</p>
          </div>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#E8C547]" />
            <span className="text-[#C4952A] text-lg">✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#E8C547]" />
          </div>
          <div className="flex justify-between text-sm mb-6">
            <div>
              <p className="text-xs text-[#9CA3AF] font-medium">Date Awarded</p>
              <p className="font-bold text-[#1B332C]">{today}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF] font-medium">Issued by</p>
              <p className="font-bold text-[#1B332C]">AIFinity Platform</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#5B6B5F] hover:bg-[#F9FAFB] transition-colors cursor-pointer">
              Close
            </button>
            <button onClick={() => window.print()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer hover:opacity-90"
              style={{ background: cert.gradient }}>
              🖨️ Save / Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Badge Tile — click to expand "how to earn"
// ─────────────────────────────────────────────────────────────────
function BadgeTile({ badge, earned, stats }) {
  const [expanded, setExpanded] = useState(false);
  const pct = badge.progress(stats);
  const circumference = 2 * Math.PI * 20;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer select-none ${
        earned ? "hover:shadow-lg hover:-translate-y-1" : "opacity-75 hover:opacity-95"
      }`}
      style={{
        background: earned ? badge.bg : "#F9FAFB",
        borderColor: earned ? badge.border : "#E5E7EB",
        boxShadow: earned ? `0 2px 16px ${badge.color}18` : "none",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* "Earned" ribbon */}
      {earned && (
        <div className="absolute top-0 right-0 overflow-hidden" style={{ width: 52, height: 52 }}>
          <div
            className="absolute text-[9px] font-black text-white text-center py-0.5"
            style={{
              top: 10, right: -18, width: 70,
              background: badge.gradient,
              transform: "rotate(45deg)",
            }}
          >
            ✓ DONE
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col items-center gap-2.5">
        {/* Progress ring */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="20" fill="none" stroke={earned ? badge.border : "#E5E7EB"} strokeWidth="3.5" />
            <circle
              cx="28" cy="28" r="20" fill="none"
              stroke={earned ? badge.color : "#D1D5DB"} strokeWidth="3.5"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <span className="text-2xl relative z-10" style={{ filter: earned ? "none" : "grayscale(0.4)" }}>
            {badge.emoji}
          </span>
        </div>

        {/* Name + tagline */}
        <div className="text-center">
          <p className="text-[13px] font-black leading-tight" style={{ color: earned ? badge.color : "#6B7280" }}>
            {badge.name}
          </p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">{badge.tagline}</p>
        </div>

        {/* XP pill */}
        <div
          className="text-[10px] font-black px-2.5 py-0.5 rounded-full border"
          style={{
            background: earned ? badge.bg : "#F3F4F6",
            color: earned ? badge.color : "#9CA3AF",
            borderColor: earned ? badge.border : "#E5E7EB",
          }}
        >
          +{badge.xp} XP
        </div>

        {/* Progress text for unearned */}
        {!earned && (
          <p className="text-[10px] text-[#9CA3AF] font-semibold">{badge.progressLabel(stats)}</p>
        )}
      </div>

      {/* Expandable tip */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-1 border-t text-center"
          style={{ borderColor: earned ? badge.border : "#E5E7EB" }}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: earned ? badge.color : "#6B7280" }}>
            {earned ? "✅ Badge earned! Great job." : `💡 ${badge.howToEarn}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Certificate Card
// ─────────────────────────────────────────────────────────────────
function CertCard({ cert, earned, userName, stats }) {
  const [showModal, setShowModal] = useState(false);

  const pct = (() => {
    const s = stats;
    if (cert.id === "cert_beginner") return Math.min(100, Math.round((s.totalAssessments / 5) * 100));
    if (cert.id === "cert_consistent") return Math.min(100, Math.round(((s.currentStreak / 7 + s.totalAssessments / 10) / 2) * 100));
    if (cert.id === "cert_excellence") return Math.min(100, Math.round(((s.avgScore / 80 + s.totalAssessments / 10) / 2) * 100));
    if (cert.id === "cert_master") return Math.min(100, Math.round(((s.totalAssessments / 25 + s.avgScore / 70) / 2) * 100));
    return 0;
  })();

  return (
    <>
      <div
        className={`rounded-2xl border overflow-hidden transition-all duration-300 ${earned ? "cursor-pointer hover:shadow-xl hover:-translate-y-1" : ""}`}
        style={{ borderColor: earned ? `${cert.color}40` : "#E5E7EB" }}
        onClick={() => earned && setShowModal(true)}
      >
        {/* Top gradient band */}
        <div className="px-5 py-4 flex items-center gap-3 relative overflow-hidden"
          style={{ background: earned ? cert.gradient : "linear-gradient(135deg, #D1D5DB, #9CA3AF)" }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <span className="text-2xl relative z-10">{cert.emoji}</span>
          <div className="relative z-10 flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Certificate</p>
            <p className="text-sm font-black text-white truncate">{cert.name}</p>
          </div>
          <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center ${earned ? "bg-white/25" : "bg-white/10"}`}>
            {earned ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4" style={{ background: "#FFFDF7" }}>
          <p className="text-xs text-[#5B6B5F] mb-3 leading-relaxed">{cert.description}</p>

          {/* Progress bar for unearned */}
          {!earned && (
            <div className="mb-3">
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span style={{ color: cert.color }}>Progress towards this certificate</span>
                <span className="text-[#9CA3AF]">{pct}%</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: "5px", background: "#F3F4F6" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: cert.gradient }} />
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-1.5 font-medium">{cert.progressDesc(stats)}</p>
            </div>
          )}

          {/* Required badges */}
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">Required badges:</p>
            <div className="flex flex-wrap gap-2">
              {cert.requiredBadges.map((bId) => {
                const badge = BADGE_DEFINITIONS.find((b) => b.id === bId);
                if (!badge) return null;
                const bEarned = badge.condition(stats);
                return (
                  <div key={bId}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      background: bEarned ? `${badge.color}12` : "#F3F4F6",
                      color: bEarned ? badge.color : "#9CA3AF",
                      borderColor: bEarned ? badge.border : "#E5E7EB",
                    }}>
                    {bEarned ? "✓" : "○"} {badge.name}
                  </div>
                );
              })}
            </div>
          </div>

          {earned && (
            <button
              className="mt-1 w-full py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90 cursor-pointer"
              style={{ background: cert.gradient }}
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              🎓 View & Download Certificate
            </button>
          )}
        </div>
      </div>

      {showModal && <CertModal cert={cert} userName={userName} onClose={() => setShowModal(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Next Goal Card — shows the badge closest to being earned
// ─────────────────────────────────────────────────────────────────
function NextGoalCard({ stats, onViewBadges }) {
  const unearned = BADGE_DEFINITIONS.filter((b) => !b.condition(stats));
  if (unearned.length === 0) {
    return (
      <div className="rounded-2xl border border-[#A7F3D0] bg-[#F0FDF4] p-5 flex items-center gap-4">
        <span className="text-3xl">🎉</span>
        <div>
          <p className="font-black text-[#065F46]">You've earned ALL badges!</p>
          <p className="text-xs text-[#059669] mt-0.5">Absolutely incredible — you're a true AIFinity Champion!</p>
        </div>
      </div>
    );
  }

  const closest = [...unearned].sort((a, b) => b.progress(stats) - a.progress(stats))[0];
  const pct = closest.progress(stats);
  const circumference = 2 * Math.PI * 24;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5"
      style={{ background: closest.bg, borderColor: closest.border }}
    >
      {/* Progress ring */}
      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
        <svg className="-rotate-90 absolute inset-0" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="24" fill="none" stroke={closest.border} strokeWidth="4.5" />
          <circle cx="32" cy="32" r="24" fill="none"
            stroke={closest.color} strokeWidth="4.5"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <span className="text-3xl relative z-10">{closest.emoji}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: closest.color }}>
          🎯 Next Badge You Can Earn
        </p>
        <h3 className="text-base font-black text-[#1B332C] mb-0.5">{closest.name}</h3>
        <p className="text-xs text-[#5B6B5F] mb-2">{closest.howToEarn}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: "6px", background: closest.border }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: closest.gradient }} />
          </div>
          <span className="text-xs font-black shrink-0" style={{ color: closest.color }}>{pct}%</span>
        </div>
        <p className="text-[11px] text-[#9CA3AF] mt-1 font-medium">{closest.progressLabel(stats)}</p>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-2">
        <div className="text-xs font-black px-3 py-1.5 rounded-full text-white"
          style={{ background: closest.gradient }}>
          +{closest.xp} XP
        </div>
        <button onClick={onViewBadges}
          className="text-[11px] font-semibold underline underline-offset-2 cursor-pointer"
          style={{ color: closest.color }}>
          See all badges
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stats Row
// ─────────────────────────────────────────────────────────────────
function StatsRow({ stats, earnedCount, certCount, totalXP }) {
  const items = [
    { label: "Badges Earned", value: `${earnedCount}/${BADGE_DEFINITIONS.length}`, emoji: "🏅" },
    { label: "Total XP", value: totalXP.toLocaleString(), emoji: "⚡" },
    { label: "Certificates", value: `${certCount}/${CERTIFICATE_DEFINITIONS.length}`, emoji: "🎓" },
    { label: "Assessments", value: stats.totalAssessments, emoji: "📝" },
    { label: "Best Score", value: `${stats.highestScore || 0}%`, emoji: "⭐" },
    { label: "Day Streak", value: stats.currentStreak, emoji: "🔥" },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center text-center rounded-2xl py-3 px-2 border border-[#F1EDE1]"
          style={{ background: "#FFFDF7" }}>
          <span className="text-xl mb-1">{item.emoji}</span>
          <p className="text-sm font-black text-[#1B332C]">{item.value}</p>
          <p className="text-[10px] text-[#9CA3AF] font-semibold mt-0.5 leading-tight">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All Badges", emoji: "🎖️" },
  { id: "milestone", label: "Milestones", emoji: "📚" },
  { id: "performance", label: "Performance", emoji: "⭐" },
  { id: "consistency", label: "Consistency", emoji: "🔥" },
  { id: "improvement", label: "Improvement", emoji: "📈" },
];

export default function AchievementBadges({ dashData, userName }) {
  const [activeTab, setActiveTab] = useState("badges");
  const [activeCategory, setActiveCategory] = useState("all");

  const stats = computeAchievementStats(dashData);

  if (!stats) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] p-10 text-center" style={{ background: "#FFFDF7" }}>
        <span className="text-4xl">⏳</span>
        <p className="mt-3 font-bold text-[#1B332C]">Loading your achievements...</p>
      </div>
    );
  }

  const earnedBadges = BADGE_DEFINITIONS.filter((b) => b.condition(stats));
  const earnedCerts = CERTIFICATE_DEFINITIONS.filter((c) => c.condition(stats));
  const totalXP = earnedBadges.reduce((sum, b) => sum + b.xp, 0);

  const filteredBadges = activeCategory === "all"
    ? BADGE_DEFINITIONS
    : BADGE_DEFINITIONS.filter((b) => b.category === activeCategory);

  // Sort: earned first, then by progress descending
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    const aE = a.condition(stats) ? 1 : 0;
    const bE = b.condition(stats) ? 1 : 0;
    if (aE !== bE) return bE - aE;
    return b.progress(stats) - a.progress(stats);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero Header */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1B332C 0%, #2E4F42 60%, #1B332C 100%)", border: "1px solid rgba(196,149,42,0.35)" }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "#E8C547", transform: "translate(40%, -40%)" }} />
        <div className="absolute bottom-0 left-10 w-40 h-40 rounded-full opacity-5 pointer-events-none"
          style={{ background: "#E8C547", transform: "translateY(50%)" }} />

        <div className="relative z-10 px-6 py-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏆</span>
                <h2 className="text-xl font-black text-[#E8C547]">Achievements & Certificates</h2>
              </div>
              <p className="text-sm text-white/60 max-w-md leading-relaxed">
                Earn badges by completing assessments, maintaining daily streaks, improving scores, and answering questions.
                Hit major milestones to unlock printable certificates!
              </p>
            </div>

            <div className="shrink-0 text-center bg-white/5 rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-3xl font-black text-[#E8C547]">{totalXP.toLocaleString()}</p>
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mt-0.5">Total XP Earned</p>
              <div className="mt-2 flex items-center gap-1 justify-center">
                {earnedBadges.slice(0, 4).map((b) => (
                  <span key={b.id} title={b.name} className="text-base">{b.emoji}</span>
                ))}
                {earnedBadges.length > 4 && (
                  <span className="text-xs text-white/40 font-bold">+{earnedBadges.length - 4}</span>
                )}
                {earnedBadges.length === 0 && (
                  <span className="text-xs text-white/30">No badges yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/50 font-semibold mb-2">
              <span>Overall Achievement Progress</span>
              <span>{earnedBadges.length}/{BADGE_DEFINITIONS.length} badges · {earnedCerts.length}/{CERTIFICATE_DEFINITIONS.length} certificates</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: "8px", background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.round((earnedBadges.length / BADGE_DEFINITIONS.length) * 100)}%`,
                  background: "linear-gradient(to right, #E8C547, #C4952A)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row */}
      <StatsRow stats={stats} earnedCount={earnedBadges.length} certCount={earnedCerts.length} totalXP={totalXP} />

      {/* ── Next Goal */}
      <NextGoalCard stats={stats} onViewBadges={() => setActiveTab("badges")} />

      {/* ── Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: "badges", label: "Badges", count: `${earnedBadges.length}/${BADGE_DEFINITIONS.length}`, emoji: "🎖️" },
          { id: "certificates", label: "Certificates", count: `${earnedCerts.length}/${CERTIFICATE_DEFINITIONS.length}`, emoji: "🎓" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border"
            style={{
              background: activeTab === tab.id ? "#1B332C" : "#FBF8F0",
              color: activeTab === tab.id ? "#E8C547" : "#5B6B5F",
              borderColor: activeTab === tab.id ? "#1B332C" : "#E5E7EB",
            }}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
              style={{
                background: activeTab === tab.id ? "rgba(232,197,71,0.2)" : "#F1EDE1",
                color: activeTab === tab.id ? "#E8C547" : "#9CA3AF",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── BADGES TAB */}
      {activeTab === "badges" && (
        <div className="flex flex-col gap-5">
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const catBadges = cat.id === "all" ? BADGE_DEFINITIONS : BADGE_DEFINITIONS.filter((b) => b.category === cat.id);
              const catEarned = catBadges.filter((b) => b.condition(stats)).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                  style={{
                    background: activeCategory === cat.id ? "#1B332C" : "#F9FAFB",
                    color: activeCategory === cat.id ? "#E8C547" : "#5B6B5F",
                    borderColor: activeCategory === cat.id ? "#1B332C" : "#E5E7EB",
                  }}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  {catEarned > 0 && (
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        background: activeCategory === cat.id ? "rgba(232,197,71,0.25)" : "#E8F5E9",
                        color: activeCategory === cat.id ? "#E8C547" : "#16A34A",
                      }}
                    >
                      {catEarned}✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tip notice */}
          <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5 font-medium">
            <span>💡</span>
            <span>Tap any badge to see exactly how to earn it. Earned badges shown first!</span>
          </p>

          {/* Badge grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sortedBadges.map((badge) => (
              <BadgeTile key={badge.id} badge={badge} earned={badge.condition(stats)} stats={stats} />
            ))}
          </div>

          {/* Empty state */}
          {earnedBadges.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] p-10 text-center">
              <span className="text-5xl">🎯</span>
              <h3 className="mt-3 font-black text-[#1B332C] text-lg">Your badge collection is empty!</h3>
              <p className="text-sm text-[#5B6B5F] mt-1 max-w-xs mx-auto">
                Complete your first assessment to instantly earn the <strong>"First Step" 🚀</strong> badge!
              </p>
              <a
                href="/assessment"
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[#E8C547] transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1B332C, #2E4F42)" }}
              >
                Take First Assessment →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── CERTIFICATES TAB */}
      {activeTab === "certificates" && (
        <div className="flex flex-col gap-5">
          {earnedCerts.length > 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-[#F0FDF4] border border-green-200 px-4 py-3">
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-sm font-bold text-green-800">
                  You've earned {earnedCerts.length} certificate{earnedCerts.length > 1 ? "s" : ""}!
                </p>
                <p className="text-xs text-green-600">Click on any earned certificate to view and download it as PDF.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-[#FFFBEB] border border-amber-200 px-4 py-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="text-sm font-bold text-amber-800">No certificates yet — here's what to do:</p>
                <p className="text-xs text-amber-600">
                  Complete 5 assessments to earn your first <strong>"Beginner Achiever"</strong> certificate. It's easier than you think!
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CERTIFICATE_DEFINITIONS.map((cert) => (
              <CertCard
                key={cert.id}
                cert={cert}
                earned={cert.condition(stats)}
                userName={userName}
                stats={stats}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
