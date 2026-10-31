import React from "react";
import { useNavigate } from "react-router-dom";

export default function FloatingAIAssistant() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/personal-intelligence")}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#1B332C] text-[#E8C547] rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border border-[#C4952A]/40 group cursor-pointer"
      aria-label="Open Personal Intelligence"
    >
      <svg
        className="w-6 h-6 group-hover:animate-pulse"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      {/* Tooltip */}
      <span className="absolute right-16 px-3 py-1.5 bg-[#FBF8F0] text-[#1B332C] text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-[#2E4F42]/10 pointer-events-none">
        Personal Intelligence
      </span>
    </button>
  );
}
