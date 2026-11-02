import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * LogoutConfirmDialog – shared confirmation modal for all logout entry points.
 *
 * Props:
 *   isOpen       {boolean}  – controls visibility
 *   onCancel     {function} – called when user dismisses without logging out
 *   onConfirm    {function} – called when user confirms logout
 *   isLoggingOut {boolean}  – disables the confirm button while logout is in-flight
 */
export default function LogoutConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  isLoggingOut = false,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape" && !isLoggingOut) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, isLoggingOut, onCancel]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    /* Backdrop – click outside to cancel */
    <div
      className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(27, 51, 44, 0.45)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        // Only cancel when clicking the backdrop itself, not the card
        if (e.target === e.currentTarget && !isLoggingOut) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-desc"
    >
      {/* Dialog card */}
      <div
        className="relative w-full max-w-sm my-auto rounded-2xl border border-[#2E4F42]/15 bg-[#FBF8F0] shadow-2xl"
        style={{
          animation: "lgDialogIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header icon */}
        <div className="flex flex-col items-center px-6 pt-7 pb-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE6D3] mb-4">
            <svg
              className="w-7 h-7 text-[#C4952A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>

          <h2
            id="logout-dialog-title"
            className="text-center text-base font-bold text-[#1B332C] leading-snug"
          >
            Are you sure you want to log out?
          </h2>
          <p
            id="logout-dialog-desc"
            className="mt-2 text-center text-sm text-[#5B6B5F] leading-relaxed"
          >
            You'll need to log in again to access your AIFinity account.
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 mt-5 border-t border-[#2E4F42]/10" />

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5">
          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={isLoggingOut}
            className="flex-1 rounded-xl border border-[#2E4F42]/30 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#1B332C] transition-all duration-200 hover:bg-[#EDE6D3] focus:outline-none focus:ring-2 focus:ring-[#2E4F42]/40 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            Cancel
          </button>

          {/* Confirm Logout */}
          <button
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 active:scale-95 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Logging out…</span>
              </>
            ) : (
              "Yes, Log Out"
            )}
          </button>
        </div>
      </div>

      {/* Keyframe animation injected inline so no extra CSS file is needed */}
      <style>{`
        @keyframes lgDialogIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
