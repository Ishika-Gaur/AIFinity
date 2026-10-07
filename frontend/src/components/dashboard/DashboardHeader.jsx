import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStudentAuth } from "../../context/StudentAuthContext";

import { LogOut } from 'lucide-react';
import DashboardLogo from "./DashboardLogo";

export default function DashboardHeader({ user, quotes = [], onOpenProfile }) {
  const navigate = useNavigate();
  const { user: sessionUser, logout } = useStudentAuth();
  const currentUser = sessionUser;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const dynamicName = currentUser?.name?.trim() || (user?.name && user.name.trim() !== "Learner" ? user.name.trim() : "");
  const greeting = user?.greeting || "Good evening";
  const subtitle = user?.subtitle || "Your learning journey, understood by AI. Track your progress, uncover learning gaps, and turn every assessment into a clearer path forward.";
  const streak = user?.streak ?? 0;

  const defaultQuotes = [
    "Every attempt is evidence. Every mistake is a step forward.",
    "Consistency builds what motivation starts.",
    "Understand the why, not just the answer.",
    "Your weak areas are your next opportunities.",
    "One concept understood deeply is worth ten memorized.",
  ];

  const activeQuotes = quotes.length > 0 ? quotes : defaultQuotes;
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fadeState, setFadeState] = useState(true);

  // Automatic quote rotation every 6 seconds with smooth fade transition
  useEffect(() => {
    if (activeQuotes.length <= 1) return;

    const intervalId = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % activeQuotes.length);
        setFadeState(true);
      }, 300); // match transition duration
    }, 6000);

    return () => clearInterval(intervalId);
  }, [activeQuotes.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/12 p-6 sm:p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
      {/* Decorative top chalk gold accent bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D9A62B] via-[#E8C547] to-[#1B332C]" />

      {/* Logout Button in Top-Right Corner */}
      <button
        onClick={handleLogout}
        type="button"
        title="Sign out of your account"
        className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10 inline-flex items-center gap-2 rounded-xl border border-[#2E4F42]/15 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 text-xs font-semibold text-[#1B332C] shadow-xs hover:border-[#C4952A]/60 hover:bg-[#EDE6D3] hover:text-[#1B332C] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C4952A]/40 transition-all duration-200 cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5 text-[#2E4F42]" />
        <span>Logout</span>
      </button>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-6 sm:pt-0">
        {/* Left branding, heading & rotating quote */}
        <div className="flex flex-col gap-3 max-w-2xl">
          <DashboardLogo />

          <div className="mt-1">
            <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1B332C] tracking-tight leading-tight flex items-center flex-wrap gap-3">
              {dynamicName ? `${greeting}, ${dynamicName} 👋` : `${greeting} 👋`}
              <button 
                type="button"
                onClick={onOpenProfile}
                className="text-xs font-sans font-semibold text-[#1B332C] bg-[#EDE6D3]/80 border border-[#2E4F42]/15 hover:bg-[#1B332C] hover:text-[#E8C547] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>⚙️</span> Edit Profile
              </button>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#5B6B5F] font-normal leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* 13. ROTATING QUOTES WITH FADE & MONO COUNTER */}
          <div className="mt-1 flex items-center gap-3 rounded-xl bg-[#EDE6D3]/60 px-4 py-2 border border-[#2E4F42]/10 w-fit min-h-[40px]">
            <span className="text-[#C4952A] text-sm shrink-0">✦</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-sans text-xs sm:text-sm text-[#1B332C] font-medium italic transition-opacity duration-300 ${
                  fadeState ? "opacity-100" : "opacity-0"
                }`}
              >
                "{activeQuotes[currentQuoteIndex]}"
              </span>
              <span className="font-mono text-[10px] font-semibold text-[#5B6B5F] bg-[#FBF8F0] px-2 py-0.5 rounded-md border border-[#2E4F42]/10 shrink-0 ml-1">
                {String(currentQuoteIndex + 1).padStart(2, "0")}/{String(activeQuotes.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions & Streak Badge */}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link to="/revision" className="inline-flex items-center gap-2 rounded-2xl bg-[#EDE6D3] px-5 py-3 text-xs font-bold text-[#1B332C] border border-[#2E4F42]/15 shadow-sm hover:bg-[#E8C547] hover:-translate-y-0.5 transition-all duration-300 group">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Revision Center</span>
          </Link>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1B332C] px-5 py-3 text-xs font-bold text-[#E8C547] border border-[#C4952A]/40 shadow-md hover:bg-[#2E4F42] hover:text-white hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <span className="text-base group-hover:scale-110 transition-transform">⚡</span>
            <span>Take Assessment</span>
            <span>→</span>
          </Link>

          <div className="flex items-center gap-3 rounded-2xl bg-[#EDE6D3] px-4 py-3 text-[#1B332C] border border-[#2E4F42]/15 shadow-2xs hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
            <span className="text-xl group-hover:scale-110 transition-transform duration-200">🔥</span>
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase tracking-wider text-[#1B332C] font-bold">
                {streak} DAY STREAK
              </span>
              <span className="font-mono text-[10px] text-[#5B6B5F]">
                {streak > 0 ? `Consistency Multiplier ${(1 + Math.min(streak, 10) * 0.1).toFixed(1)}x` : "Make today your first consistent step."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



