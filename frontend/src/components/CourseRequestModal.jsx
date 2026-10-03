import React, { useState, useEffect } from "react";
import { courseRequestApi } from "../services/api";
import { useStudentAuth } from "../context/StudentAuthContext";

export default function CourseRequestModal({
  isOpen,
  onClose,
  initialCourseName = "",
  onSuccess,
}) {
  const { user } = useStudentAuth();

  const [courseName, setCourseName] = useState(initialCourseName);
  const [provider, setProvider] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [reason, setReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync initialCourseName whenever modal opens with a new search term
  useEffect(() => {
    if (isOpen) {
      setCourseName(initialCourseName || "");
      setError("");
      setSuccessMessage("");
    }
  }, [isOpen, initialCourseName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission

    setError("");

    // Frontend validation
    const trimmedCourseName = courseName.trim();
    const trimmedReason = reason.trim();

    if (!trimmedCourseName) {
      setError("Please provide a Course Name.");
      return;
    }

    if (trimmedCourseName.length < 2) {
      setError("Course Name must be at least 2 characters.");
      return;
    }

    if (!trimmedReason) {
      setError("Please explain why you want this course.");
      return;
    }

    if (trimmedReason.length < 5) {
      setError("Please provide a more descriptive reason (at least 5 characters).");
      return;
    }

    if (referenceUrl.trim()) {
      try {
        const parsed = new URL(referenceUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error();
        }
      } catch {
        setError("Reference URL must start with http:// or https://");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await courseRequestApi.create({
        courseName: trimmedCourseName,
        provider: provider.trim(),
        referenceUrl: referenceUrl.trim(),
        reason: trimmedReason,
        additionalDetails: additionalDetails.trim(),
      });

      if (res && res.success) {
        setSuccessMessage("Course request submitted successfully. Thanks! We've sent your request to the AIFinity team.");
        // Reset form
        setCourseName("");
        setProvider("");
        setReferenceUrl("");
        setReason("");
        setAdditionalDetails("");

        if (onSuccess) {
          onSuccess(res.request);
        }

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setError(res.error || res.message || "Failed to submit course request.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#2E4F42]/20 bg-[#FBF8F0] p-6 sm:p-8 shadow-2xl transition-all"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 h-8 w-8 rounded-full border border-[#2E4F42]/15 bg-white text-[#1B332C]/70 hover:text-[#1B332C] hover:bg-[#EDE6D3] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2E4F42]/15 bg-white px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#C4952A] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ✦ LEARNER REQUEST
          </span>
          <h2
            id="modal-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B332C]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Request a New Course
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5B6B5F] leading-relaxed">
            Can't find the course you're looking for? Tell us what you'd like to learn and we'll review your request.
          </p>
          {user && (
            <p className="mt-1 text-xs text-[#8B9690]">
              Submitting as: <strong className="text-[#1B332C]">{user.name}</strong> ({user.email})
            </p>
          )}
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs flex items-start gap-3 animate-fade-in">
            <span className="text-xl">✓</span>
            <div>
              <p className="font-bold">Course request submitted successfully.</p>
              <p className="mt-0.5 text-xs text-emerald-800">
                Thanks! We've sent your request to the AIFinity team.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-900 shadow-xs flex items-start gap-2.5 animate-fade-in">
            <span className="text-base text-rose-600">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Name (Required) */}
            <div>
              <label
                htmlFor="courseName"
                className="block text-xs font-bold uppercase tracking-wider text-[#1B332C] mb-1.5"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Course Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="courseName"
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Next.js, Rust for Systems, Advanced LLM Fine-Tuning"
                className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-4 py-2.5 text-sm text-[#1B332C] shadow-xs outline-none focus:border-[#1B332C] focus:ring-2 focus:ring-[#1B332C]/20 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Why do you want this course? (Required) */}
            <div>
              <label
                htmlFor="reason"
                className="block text-xs font-bold uppercase tracking-wider text-[#1B332C] mb-1.5"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Why do you want this course? <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="reason"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. I want to learn Next.js for full-stack web development and production apps."
                className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-4 py-2.5 text-sm text-[#1B332C] shadow-xs outline-none focus:border-[#1B332C] focus:ring-2 focus:ring-[#1B332C]/20 transition-all placeholder:text-slate-400 resize-y"
              />
            </div>

            {/* Provider / Instructor (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="provider"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1B332C] mb-1.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Provider / Instructor <span className="text-xs text-[#8B9690] lowercase font-normal">(optional)</span>
                </label>
                <input
                  id="provider"
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Udemy, Coursera, MIT"
                  className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-4 py-2.5 text-sm text-[#1B332C] shadow-xs outline-none focus:border-[#1B332C] focus:ring-2 focus:ring-[#1B332C]/20 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Reference URL (Optional) */}
              <div>
                <label
                  htmlFor="referenceUrl"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1B332C] mb-1.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Reference URL <span className="text-xs text-[#8B9690] lowercase font-normal">(optional)</span>
                </label>
                <input
                  id="referenceUrl"
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-4 py-2.5 text-sm text-[#1B332C] shadow-xs outline-none focus:border-[#1B332C] focus:ring-2 focus:ring-[#1B332C]/20 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Additional Details (Optional) */}
            <div>
              <label
                htmlFor="additionalDetails"
                className="block text-xs font-bold uppercase tracking-wider text-[#1B332C] mb-1.5"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Additional Details <span className="text-xs text-[#8B9690] lowercase font-normal">(optional)</span>
              </label>
              <textarea
                id="additionalDetails"
                rows={2}
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Any specific syllabus topics, prerequisite expectations, or project interests..."
                className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-4 py-2.5 text-sm text-[#1B332C] shadow-xs outline-none focus:border-[#1B332C] focus:ring-2 focus:ring-[#1B332C]/20 transition-all placeholder:text-slate-400 resize-y"
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#2E4F42]/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto rounded-xl border border-[#2E4F42]/20 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1B332C] hover:bg-[#EDE6D3] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B332C] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#E8C547] border border-[#C4952A]/40 shadow-md hover:bg-[#2E4F42] active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#E8C547] border-t-transparent" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Course Request</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
