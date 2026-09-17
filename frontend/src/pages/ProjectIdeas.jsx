import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button";

import { analyticsApi } from "../services/api";
import { getUserProfile } from "../utils/constants";

export default function ProjectIdeas() {
  const [searchParams] = useSearchParams();
  const incomingTopic = searchParams.get("topic") || "";
  const incomingDifficulty = searchParams.get("difficulty") || "";
  const profile = getUserProfile();

  const [selectedDifficulty, setSelectedDifficulty] = useState(incomingDifficulty || "All");
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [projectSpecs, setProjectSpecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const targetTopic = incomingTopic || profile.careerGoal || profile.field || "Core Competency";
        const targetField = searchParams.get("field") || profile.field || "General Field";
        const res = await analyticsApi.getProjectIdeas(targetTopic, targetField);
        if (res && res.success && res.data && res.data.projects) {
          setProjectSpecs(res.data.projects);
          if (res.data.projects.length > 0) {
            setExpandedProjectId(res.data.projects[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load project ideas", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [incomingTopic, profile.field, profile.careerGoal]);

  useEffect(() => {
    if (incomingDifficulty) setSelectedDifficulty(incomingDifficulty);
  }, [incomingDifficulty]);

  const filteredProjects = projectSpecs.filter((p) => {
    if (selectedDifficulty === "All") return true;
    return p.difficulty === selectedDifficulty;
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Header Banner */}
      <div className="border-b border-[#2E4F42]/12 bg-[#FBF8F0] py-10 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  to="/roadmap"
                  className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1"
                >
                  ← Back to Roadmap
                </Link>
                <span className="text-[#8B9690]">•</span>
                <span className="rounded-full bg-[#E8C547]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B332C]">
                  Career Portfolio Projects
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-extrabold text-[#1B332C]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Project Ideas & Architecture Blueprints
              </h1>
              <p className="mt-1.5 text-sm text-[#5B6B5F] max-w-2xl">
                Real-world portfolio projects engineered to prove your competency at each milestone of your career roadmap.
              </p>
              {/* Roadmap context banner */}
              {incomingTopic && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#DBEAFE] border border-blue-200 px-4 py-2 text-xs font-semibold text-[#1D4ED8]">
                  <span>💡</span>
                  <span>Building for your roadmap phase: <strong>{incomingTopic}</strong></span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/roadmap")}
              >
                View Roadmap Milestones →
              </Button>
              {incomingTopic && (
                <button
                  type="button"
                  onClick={() => navigate(`/assessment?topic=${encodeURIComponent(incomingTopic)}`)}
                  className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1"
                >
                  ✅ Next: Test Knowledge →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Difficulty Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#2E4F42]/12">
          {["All", "Beginner", "Intermediate", "Advanced", "Production Ready"].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                selectedDifficulty === diff
                  ? "bg-[#1B332C] text-[#E8C547] shadow-xs"
                  : "bg-[#FBF8F0] text-[#5B6B5F] border border-[#2E4F42]/12 hover:bg-[#EDE6D3] hover:text-[#1B332C]"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-10 h-10 animate-spin text-[#2E4F42]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-4 text-sm font-bold text-[#1B332C]">Generating personalized project specs via AI...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 text-[#5B6B5F]">
            No projects found for the selected difficulty.
          </div>
        ) : (
          <>
          {/* Project Cards Grid */}
          <div className="space-y-8">
            {filteredProjects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            return (
              <div
                key={project.id}
                className="rounded-2xl border border-[#2E4F42]/12 bg-[#FBF8F0] p-6 sm:p-8 shadow-[var(--shadow-card)] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#2E4F42]/10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="rounded-md bg-[#2E4F42] px-2.5 py-0.5 text-[10px] font-mono font-bold text-white uppercase">
                        {project.difficulty}
                      </span>
                      <span className="rounded-md bg-[#EDE6D3] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#2E4F42]">
                        {project.level}
                      </span>
                      <span className="text-xs text-[#8B9690] font-mono">
                        ~{project.estimatedHours} hrs build time
                      </span>
                    </div>

                    <h2
                      className="text-xl sm:text-2xl font-bold text-[#1B332C]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {project.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#2E4F42]/15 bg-white px-4 py-2 text-xs font-bold text-[#1B332C] hover:bg-[#EDE6D3] transition self-start sm:self-auto shrink-0"
                  >
                    <span>{isExpanded ? "Hide Spec" : "View Architecture Spec"}</span>
                    <span>{isExpanded ? "▲" : "▼"}</span>
                  </button>
                </div>

                <p className="mt-4 text-sm text-[#24413A] leading-relaxed">
                  {project.description}
                </p>

                {/* Tech Stack Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-[#2E4F42]/10 bg-[#EDE6D3]/60 px-2.5 py-1 text-xs font-medium text-[#1B332C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Why this matters for hiring */}
                <div className="mt-4 rounded-xl border border-[#D9A62B]/30 bg-[#FBF3DC]/60 p-3.5 text-xs text-[#1B332C]">
                  <span className="font-bold text-[#B9860F]">💼 Why Recruiters Value This: </span>
                  <span>{project.whyForCareer}</span>
                </div>

                {/* Expanded Architecture & Features */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-[#2E4F42]/10 space-y-6">
                    {/* Key Deliverables */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E4F42] mb-3">
                        Functional Deliverables & Requirements
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {project.features.map((feat, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl border border-[#2E4F42]/10 bg-white/70 p-3"
                          >
                            <span className="text-[#2E4F42] font-bold">✓</span>
                            <span className="text-xs text-[#24413A] font-medium">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Architecture Blueprint Code */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E4F42] mb-2">
                        Core Architecture Blueprint
                      </h4>
                      <div className="rounded-xl overflow-hidden border border-[#1B332C]/30 bg-[#162923] p-4 text-xs font-mono text-[#FBF8F0] shadow-inner">
                        <pre className="overflow-x-auto leading-5">
                          <code>{project.architecture}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
