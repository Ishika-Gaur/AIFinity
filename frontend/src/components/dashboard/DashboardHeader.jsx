import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";

import { LogOut } from 'lucide-react';
import DashboardLogo from "./DashboardLogo";

export default function DashboardHeader({ user, quotes = [] }) {
  const navigate = useNavigate();

  // Retrieve authenticated user from localStorage cache or authApi.getMe()
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;
    authApi
      .getMe()
      .then((res) => {
        if (isMounted && res.success && res.user) {
          setCurrentUser(res.user);
          try {
            localStorage.setItem("user", JSON.stringify(res.user));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("user");
    } catch {}
    const res = await authApi.logout();
    if (res.success) {
      navigate('/login');
    } else {
      console.error('Logout failed', res.error);
      navigate('/login');
    }
  };

  const dynamicName = currentUser?.name?.trim() || (user?.name && user.name.trim() !== "Learner" ? user.name.trim() : "");
  const greeting = user?.greeting || "Good evening";
  const subtitle = user?.subtitle || "Here's where your learning journey stands today.";
  const streak = user?.streak ?? 0;

  const defaultQuotes = [
    "Small progress is still progress.",
    "Consistency builds what motivation starts.",
    "Every mistake is a clue.",
    "Understand the why, not just the answer.",
    "Your weak areas are your next opportunities.",
    "Practice turns confusion into confidence.",
    "Keep learning. Keep questioning. Keep improving.",
    "One concept understood deeply is worth ten memorized.",
    "Your mistakes are showing you where to grow.",
    "Progress is built one problem at a time.",
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
            <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1B332C] tracking-tight leading-tight">
              {dynamicName ? `${greeting}, ${dynamicName} 👋` : `${greeting} 👋`}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-[#5B6B5F] font-normal leading-relaxed">
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
                {streak > 0 ? `Consistency Multiplier ${(1 + Math.min(streak, 10) * 0.1).toFixed(1)}x` : "Start your streak!"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
