import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import Section from "../components/Section";
import CourseRequestModal from "../components/CourseRequestModal";
import { FIELDS, FIELD_ICONS, CAREER_GOALS_BY_FIELD } from "../utils/constants";
import { useStudentAuth } from "../context/StudentAuthContext";
import { courseRequestApi } from "../services/api";

export default function CourseSelection() {
  const { user } = useStudentAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCourseName, setModalCourseName] = useState("");

  // User's Own Requests
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState("browse"); // "browse" | "my-requests"

  // Fetch user requests if logged in
  useEffect(() => {
    if (user) {
      setLoadingRequests(true);
      courseRequestApi
        .getMyRequests()
        .then((res) => {
          if (res && res.success) {
            setMyRequests(res.requests || []);
          }
        })
        .catch((err) => console.error("Error loading user requests:", err))
        .finally(() => setLoadingRequests(false));
    }
  }, [user]);

  // Transform FIELDS into course card items
  const allCourses = useMemo(() => {
    return FIELDS.map((name) => {
      const goals = CAREER_GOALS_BY_FIELD[name] || [];
      return {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name,
        icon: FIELD_ICONS[name] || "📚",
        tags: goals.slice(0, 3),
        totalSpecializations: goals.length,
        description: `Master industry-ready concepts, real-world assessments, and personalized career roadmaps in ${name}.`,
      };
    });
  }, []);

  // Filtered courses based on search & category
  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const matchesSearch =
        !searchTerm.trim() ||
        course.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        course.tags.some((t) => t.toLowerCase().includes(searchTerm.trim().toLowerCase()));

      return matchesSearch;
    });
  }, [allCourses, searchTerm]);

  const openRequestModal = (prefilledName = "") => {
    setModalCourseName(prefilledName);
    setIsModalOpen(true);
  };

  const handleRequestCreated = (newReq) => {
    setMyRequests((prev) => [newReq, ...prev]);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "reviewing":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "rejected":
        return "bg-rose-50 text-rose-800 border-rose-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      className="min-h-screen bg-grid"
      style={{
        backgroundColor: "var(--color-bg)",
        backgroundImage:
          "linear-gradient(to right, rgba(27, 51, 44, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(27, 51, 44, 0.04) 1px, transparent 1px), linear-gradient(to right, rgba(27, 51, 44, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(27, 51, 44, 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
      }}
    >
      <Section className="pt-10 pb-16">
        <Container>
          {/* Header & Hero */}
          <div className="mx-auto max-w-3xl text-center mb-10">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[#2E4F42]/20 bg-white px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#C4952A] shadow-xs mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              🎓 EXPLORE PATHWAYS
            </span>
            <h1
              className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1B332C]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Choose Your Course
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[#5B6B5F] leading-relaxed max-w-xl mx-auto">
              Select an industry domain to begin AI-powered assessments, diagnostic concept roots, and personalized roadmaps.
            </p>

            {/* Navigation Tabs (Browse Courses vs My Requests) */}
            {user && (
              <div className="mt-6 inline-flex rounded-2xl border border-[#2E4F42]/15 bg-white p-1 shadow-xs">
                <button
                  onClick={() => setActiveTab("browse")}
                  className={`rounded-xl px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "browse"
                      ? "bg-[#1B332C] text-[#E8C547] shadow-xs"
                      : "text-[#24413A] hover:bg-[#EDE6D3]/60"
                  }`}
                >
                  Available Courses ({allCourses.length})
                </button>
                <button
                  onClick={() => setActiveTab("my-requests")}
                  className={`rounded-xl px-5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "my-requests"
                      ? "bg-[#1B332C] text-[#E8C547] shadow-xs"
                      : "text-[#24413A] hover:bg-[#EDE6D3]/60"
                  }`}
                >
                  <span>My Requests</span>
                  {myRequests.length > 0 && (
                    <span className="rounded-full bg-[#E8C547] text-[#1B332C] px-1.5 py-0.2 text-[10px] font-extrabold">
                      {myRequests.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: BROWSE COURSES */}
          {activeTab === "browse" && (
            <>
              {/* Search & Filter Bar */}
              <div className="mx-auto max-w-2xl mb-10">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search courses, skills, or domains (e.g. Next.js, AI, Medicine, Finance)..."
                    className="w-full rounded-2xl border border-[#2E4F42]/20 bg-white pl-12 pr-10 py-3.5 text-sm sm:text-base text-[#1B332C] shadow-sm outline-none focus:border-[#1B332C] focus:ring-2 focus:ring-[#1B332C]/20 transition-all placeholder:text-slate-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B332C] text-sm cursor-pointer p-1"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* ZERO-SEARCH-RESULT EXPERIENCE (Requirement 2) */}
              {filteredCourses.length === 0 && searchTerm.trim() && (
                <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#C4952A]/40 bg-white/90 p-8 sm:p-10 text-center shadow-md animate-fade-in my-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9E6] text-2xl border border-[#E8C547]">
                    🔎
                  </div>
                  <h3
                    className="text-xl sm:text-2xl font-extrabold text-[#1B332C]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    No courses found for '{searchTerm}'
                  </h3>
                  <p className="mt-2 text-sm text-[#5B6B5F]">
                    We don't have this course yet.
                  </p>

                  <button
                    onClick={() => openRequestModal(searchTerm.trim())}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#E8C547] border border-[#C4952A]/40 shadow-md hover:bg-[#2E4F42] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Request '{searchTerm}'</span>
                    <span className="text-base">→</span>
                  </button>
                </div>
              )}

              {/* COURSE CARDS GRID */}
              {filteredCourses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="group flex flex-col justify-between rounded-3xl border border-[#2E4F42]/15 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div>
                        {/* Top Icon & Tag */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF8F0] border border-[#2E4F42]/10 text-2xl group-hover:scale-110 transition-transform">
                            {course.icon}
                          </span>
                          <span className="rounded-full bg-[#1B332C]/5 px-2.5 py-1 text-[11px] font-semibold text-[#1B332C]">
                            {course.totalSpecializations} specializations
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-[#1B332C] group-hover:text-[#C4952A] transition-colors leading-snug">
                          {course.name}
                        </h3>

                        {/* Description */}
                        <p className="mt-2 text-xs text-[#5B6B5F] leading-relaxed line-clamp-2">
                          {course.description}
                        </p>

                        {/* Specialization Tags */}
                        {course.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {course.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg bg-[#EDE6D3]/40 border border-[#2E4F42]/10 px-2 py-0.5 text-[10px] font-medium text-[#24413A]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="mt-6 pt-4 border-t border-[#2E4F42]/10 flex items-center justify-between">
                        <Link
                          to={`/assessment`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B332C] hover:text-[#C4952A] transition-colors"
                        >
                          <span>Explore Assessments</span>
                          <span>&rarr;</span>
                        </Link>
                        <Link
                          to={`/roadmap`}
                          className="rounded-xl border border-[#2E4F42]/20 bg-[#FBF8F0] px-3 py-1.5 text-xs font-semibold text-[#1B332C] hover:bg-[#EDE6D3] transition-colors"
                        >
                          View Roadmap
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* USER-SIDE CTA: Placed below existing course list/cards (Requirement 1) */}
              <div className="mt-14 pt-10 border-t border-[#2E4F42]/15 text-center">
                <div className="mx-auto max-w-xl rounded-3xl border border-[#2E4F42]/15 bg-gradient-to-b from-[#FBF8F0] to-[#F1EDE1] p-8 sm:p-10 shadow-sm">
                  <span
                    className="text-xs font-bold uppercase tracking-wider text-[#C4952A]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    MISSING A COURSE?
                  </span>
                  <h3
                    className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1B332C]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Can't find the course you're looking for?
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#5B6B5F] leading-relaxed max-w-md mx-auto">
                    Tell us what subject or framework you'd like to pursue. Our academic engineering team reviews new course requests regularly.
                  </p>

                  <div className="mt-6">
                    <button
                      onClick={() => openRequestModal("")}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#E8C547] border border-[#C4952A]/40 shadow-md hover:bg-[#2E4F42] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
                    >
                      <span>+ Request a New Course</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MY COURSE REQUESTS (Requirement 11) */}
          {activeTab === "my-requests" && user && (
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#1B332C]">
                    My Submitted Course Requests
                  </h2>
                  <p className="text-xs text-[#5B6B5F]">
                    Track review progress for courses you requested.
                  </p>
                </div>
                <button
                  onClick={() => openRequestModal("")}
                  className="rounded-xl bg-[#1B332C] text-[#E8C547] px-4 py-2 text-xs font-bold border border-[#C4952A]/30 hover:bg-[#2E4F42] transition-colors cursor-pointer"
                >
                  + New Request
                </button>
              </div>

              {loadingRequests ? (
                <div className="rounded-3xl border border-[#2E4F42]/15 bg-white p-10 text-center text-sm text-[#8B9690]">
                  Loading your requests...
                </div>
              ) : myRequests.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#2E4F42]/20 bg-white p-12 text-center">
                  <p className="text-sm font-semibold text-[#1B332C]">
                    You haven't requested any courses yet.
                  </p>
                  <p className="mt-1 text-xs text-[#5B6B5F]">
                    Can't find a topic you want? Click below to request it!
                  </p>
                  <button
                    onClick={() => openRequestModal("")}
                    className="mt-5 rounded-xl bg-[#1B332C] text-[#E8C547] px-5 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    + Request a New Course
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-[#2E4F42]/15 bg-white p-5 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <h4 className="text-base font-bold text-[#1B332C]">
                          {req.courseName}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider capitalize ${getStatusBadge(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.provider && (
                        <p className="text-xs text-[#8B9690] mb-2">
                          Provider / Instructor: <span className="text-[#1B332C] font-medium">{req.provider}</span>
                        </p>
                      )}

                      <p className="text-xs text-[#5B6B5F] bg-[#FBF8F0] p-3 rounded-xl border border-[#2E4F42]/10 mb-3">
                        <strong className="text-[#1B332C]">Reason: </strong>
                        {req.reason}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#8B9690]">
                        <span>Submitted on {new Date(req.createdAt).toLocaleDateString()}</span>
                        {req.referenceUrl && (
                          <a
                            href={req.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C4952A] underline hover:text-[#1B332C]"
                          >
                            Reference Link ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>

      {/* Course Request Modal */}
      <CourseRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCourseName={modalCourseName}
        onSuccess={handleRequestCreated}
      />
    </div>
  );
}
