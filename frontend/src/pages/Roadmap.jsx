import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Container from "../components/Container";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import Button from "../components/Button";
import Card from "../components/Card";
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";
import { analyticsApi, assessmentApi } from "../services/api";
import { getPrimaryDocUrl } from "../utils/docLinks";
import { FIELDS } from "../utils/constants";



/* =========================================================
   REUSABLE SVG ICONS
========================================================= */
function CheckIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function AlertIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function LightbulbIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function SpinnerIcon({ className = "w-5 h-5 animate-spin" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

/* =========================================================
   CAREER FIELD ROADMAP GENERATOR TEMPLATES
========================================================= */
const PRESET_CAREERS = FIELDS.map(field => ({
  id: field.toLowerCase().replace(/\s+/g, '-'),
  title: field,
  field: field,
  icon: "🎯",
  duration: "6 Months"
}));

/* =========================================================
   SUB-COMPONENTS
========================================================= */
function StatusBadge({ status }) {
  const styleMap = {
    completed: { borderColor: "var(--color-confirm)", background: "var(--color-primary-50)", color: "var(--color-confirm)" },
    current: { borderColor: "var(--color-accent)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" },
    upcoming: { borderColor: "var(--color-primary-200)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" },
    locked: { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-light)" },
  };

  const labels = {
    completed: "Completed Phase",
    current: "Active Focus",
    upcoming: "Next Milestone",
    locked: "Locked Phase",
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-200"
      style={styleMap[status] || styleMap.locked}
    >
      {status === "completed" && <CheckIcon className="w-3.5 h-3.5" style={{ color: "var(--color-confirm)" }} />}
      {status === "current" && <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />}
      {status === "upcoming" && <ArrowRightIcon className="w-3.5 h-3.5" style={{ color: "var(--color-primary-600)" }} />}
      {status === "locked" && <LockIcon className="w-3.5 h-3.5" style={{ color: "var(--color-text-light)" }} />}
      {labels[status]}
    </span>
  );
}

function PriorityBadge({ priority, isWeakConcept }) {
  if (priority === "High" || isWeakConcept) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ borderColor: "rgba(220, 38, 38, 0.3)", background: "rgba(254, 226, 226, 0.7)", color: "#b91c1c" }}
      >
        <AlertIcon className="w-3 h-3" />
        {isWeakConcept ? "High Priority (Weak Concept)" : "High Priority"}
      </span>
    );
  }

  if (priority === "Medium") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ borderColor: "var(--color-primary-200)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}
      >
        Medium Priority
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" }}
    >
      Standard Priority
    </span>
  );
}

function ProgressBar({ value, className = "" }) {
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full ${className}`} style={{ background: "var(--color-surface-secondary)" }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: "var(--color-primary-600)" }}
      />
    </div>
  );
}

function StageCard({ stage, expanded, onToggle, onStart, onToggleCompletion }) {
  const navigate = useNavigate();
  const isLocked = stage.status === "locked";

  const handleViewDetails = () => {
    navigate("/dashboard");
  };

  const handleActionClick = () => {
    if (stage.status === "completed") {
      navigate("/dashboard");
    } else {
      onStart(stage);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        borderColor: stage.status === "current" ? "var(--color-primary-300)" : "var(--color-border)",
        background: isLocked ? "var(--color-surface-secondary)" : "var(--color-surface)",
        boxShadow: stage.status === "current" ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        opacity: isLocked ? 0.85 : 1,
      }}
    >
      {stage.status === "current" && (
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--color-primary-600)" }} />
      )}

      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          {/* Completion Toggle Circle */}
          <button
            type="button"
            onClick={() => !isLocked && onToggleCompletion(stage.id)}
            title={isLocked ? "Locked phase" : "Click to mark phase completed"}
            disabled={isLocked}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            style={
              stage.status === "completed"
                ? { background: "var(--color-confirm)", color: "#fff" }
                : stage.status === "current"
                ? { background: "var(--color-primary-600)", color: "#fff" }
                : isLocked
                ? { background: "var(--color-surface-secondary)", color: "var(--color-text-light)", cursor: "not-allowed" }
                : { background: "var(--color-primary-50)", color: "var(--color-primary-600)" }
            }
          >
            {stage.status === "completed" ? <CheckIcon className="w-5 h-5" /> : stage.id}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={stage.status} />
                  <PriorityBadge priority={stage.priority} isWeakConcept={stage.isWeakConcept} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>
                    {stage.phase}
                  </span>
                </div>

                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>{stage.title}</h3>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                <ClockIcon className="w-4 h-4" style={{ color: "var(--color-text-light)" }} />
                {stage.duration}
              </div>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--color-text-muted)" }}>
              {stage.description}
            </p>

            {/* Why You Need to Learn This - Personalized AI Reason */}
            {stage.why && (
              <div className="mt-4 rounded-xl border p-3.5 text-xs leading-5 transition-all" style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)", color: "var(--color-text-h)" }}>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: "var(--color-surface)", color: "var(--color-primary-600)" }}>
                    <LightbulbIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: "var(--color-primary-700)" }}>
                      Why You Need to Learn This (Assessment Insights):
                    </span>
                    <p className="mt-0.5 text-xs font-medium leading-5" style={{ color: "var(--color-text-muted)" }}>
                      {stage.why}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stage Progress Bar */}
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                <span>Estimated Stage Progress</span>
                <span className="font-bold" style={{ color: "var(--color-primary-600)" }}>{stage.progress || 0}%</span>
              </div>
              <ProgressBar value={stage.progress || 0} />
            </div>

            {/* Concepts Chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {stage.concepts && stage.concepts.map((concept) => (
                <span
                  key={concept}
                  className="rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors duration-200"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" }}
                >
                  {concept}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span className="font-bold" style={{ color: "var(--color-text-h)" }}>{stage.questions || 20}</span> career practice modules
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewDetails}
                  className="rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                >
                  View details
                </button>

                {!isLocked && (
                  <Button
                    size="sm"
                    variant={stage.status === "current" ? "primary" : "outline"}
                    onClick={handleActionClick}
                  >
                    {stage.status === "completed" ? "Review Phase" : stage.status === "current" ? "Start Learning" : "Preview"}
                  </Button>
                )}
              </div>
            </div>

            {expanded && (
              <div className="mt-5 rounded-xl border p-4 sm:p-5 transition-all" style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>
                  Required Competencies & Action Items
                </p>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {stage.concepts && stage.concepts.map((concept, index) => (
                    <div
                      key={concept}
                      className="flex items-center gap-3 rounded-lg border p-3 shadow-xs transition-all hover:shadow-md"
                      style={{ borderColor: "var(--color-primary-100)", background: "var(--color-surface)" }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}>
                        {index + 1}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                        {concept}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   NO ASSESSMENT EMPTY STATE COMPONENT
========================================================= */
function EmptyRoadmapState() {
  const navigate = useNavigate();

  return (
    <Section className="pt-8">
      <Card hoverable={false} className="mx-auto max-w-3xl p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-600)" }}>
          <SparklesIcon className="w-8 h-8" />
        </div>

        <h3 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
          No Assessment Data Found
        </h3>

        <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-muted)" }}>
          Your learning roadmap is personalized using your actual assessment performance, weak concepts, mistake patterns, and skill gaps. Complete your first assessment to unlock your custom learning path.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={() => navigate("/assessment")}
            icon={<ArrowRightIcon />}
          >
            Take Your First Assessment
          </Button>
        </div>

        <div className="mt-8 grid gap-4 border-t pt-6 text-left sm:grid-cols-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>01. Measure</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Complete an assessment to test domain knowledge.</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>02. Detect</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Identify weak concepts, mistake patterns, and skill gaps.</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>03. Personalize</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Automatically generate your custom 0-100% roadmap.</p>
          </div>
        </div>
      </Card>
    </Section>
  );
}

/* =========================================================
   MAIN ROADMAP COMPONENT
========================================================= */
export default function Roadmap() {
  const [stages, setStages] = useState([]);
  const [targetCareer, setTargetCareer] = useState("Frontend Developer");
  const [readinessScore, setReadinessScore] = useState(25);
  const [hasHistory, setHasHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI States
  const [activeTab, setActiveTab] = useState("roadmap"); // "roadmap" | "this_week" | "all_tasks" | "resources"
  const [expandedPhases, setExpandedPhases] = useState({ 1: true }); // Phase 1 open by default
  const [allExpanded, setAllExpanded] = useState(false);
  const [notification, setNotification] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customCareerInput, setCustomCareerInput] = useState("");
  const [showCareerSelector, setShowCareerSelector] = useState(false);

  const [completedTasks, setCompletedTasks] = useState({});

  const navigate = useNavigate();

  // Track per-phase loading state for Continue Learning button
  const [continueLearningLoading, setContinueLearningLoading] = useState(null);

  /**
   * Generates an AI assessment scoped to the phase's first topic + career field,
   * then navigates directly into that assessment. Falls back to the
   * assessment page with a topic query param if generation fails.
   */
  const handleTestKnowledge = async (phase) => {
    const topic = phase.topics?.[0] || phase.title;
    const field = targetCareer || "Software Development";
    setContinueLearningLoading(phase.id);
    try {
      const res = await assessmentApi.generateAI({
        field,
        topic,
        difficulty: phase.priority === "High" ? "Hard" : phase.priority === "Medium" ? "Medium" : "Easy",
        count: 10,
      });
      if (res.success && res.assessmentId) {
        window.location.href = `/assessment/${res.assessmentId}`;
      } else {
        // fallback — open assessment page pre-filtered
        navigate(`/assessment?topic=${encodeURIComponent(topic)}&field=${encodeURIComponent(field)}`);
      }
    } catch {
      navigate(`/assessment?topic=${encodeURIComponent(topic)}&field=${encodeURIComponent(field)}`);
    } finally {
      setContinueLearningLoading(null);
    }
  };


  // Weekly Focus Checklist dynamically populated from Phase 1
  const activePhases = stages.length > 0 ? stages : [];
  const WEEKLY_FOCUS_ITEMS = activePhases[0]?.tasks?.slice(0, 4) || [];

  // Resources list dynamically generated for the career
  const HELPFUL_RESOURCES = [
    { id: "res-1", title: `${targetCareer} Handbook`, type: "guide", icon: "📄", url: `/resources/handbook?topic=${encodeURIComponent(targetCareer)}` },
    { id: "res-2", title: "Interactive Practice", type: "practice", icon: "💻", url: "/assessment" },
    { id: "res-3", title: "Common Mistakes", type: "mistakes", icon: "🎥", url: "/mistake-map" },
    { id: "res-4", title: "Project Ideas", type: "projects", icon: "💡", url: `/resources/project-ideas?topic=${encodeURIComponent(targetCareer)}` },
  ];

  // Load roadmap from backend API
  const fetchRoadmap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getRoadmap();
      if (res && res.success && res.data) {
        setHasHistory(res.data.hasHistory ?? true);
        const career = res.data.targetCareer || "Frontend Developer";
        setTargetCareer(career);

        if (Array.isArray(res.data.stages) && res.data.stages.length > 0) {
          // Map backend stages into enriched interactive structure
          const formatted = res.data.stages.map((st, idx) => {
            const phaseNum = idx + 1;
            const weekStart = (phaseNum - 1) * 2 + 1;
            const weekEnd = phaseNum * 2;
            const concepts = st.concepts || ["Core Theory", "Practical Patterns", "Project Application"];
            return {
              id: st.id || phaseNum,
              phaseNum,
              weeks: st.duration ? `Weeks ${weekStart}–${weekEnd}` : `Weeks ${weekStart}–${weekEnd}`,
              title: st.title.replace(/^Phase\s*\d+:\s*/i, ""),
              priority: st.priority === "High" || st.isWeakConcept ? "High" : st.priority === "Medium" ? "Medium" : "Low",
              baseProgress: st.progress || (st.status === "completed" ? 100 : st.status === "current" ? 40 : 0),
              description: st.description || `Master essential competencies for ${career}.`,
              topics: concepts,
              tasks: [
                { id: `task-${phaseNum}-0`, text: `Revise ${concepts[0] || "core concepts"}` },
                { id: `task-${phaseNum}-1`, text: `Solve 20+ ${concepts[1] || concepts[0] || "topic"} practice questions` },
                { id: `task-${phaseNum}-2`, text: `Build a small ${concepts[2] || "hands-on"} project` },
              ],
              status: st.status || (idx === 0 ? "current" : "upcoming"),
              why: st.why || "",
            };
          });
          setStages(formatted);
        } else {
          setStages([]);
        }
      } else {
        setStages([]);
      }
    } catch (err) {
      console.warn("Failed to load roadmap:", err);
      setStages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => setNotification(""), 4000);
    }
    return () => timer && clearTimeout(timer);
  }, [notification]);

  // Expand / Collapse all handler
  const handleToggleExpandAll = () => {
    if (allExpanded) {
      setExpandedPhases({});
      setAllExpanded(false);
    } else {
      const all = {};
      activePhases.forEach((p) => {
        all[p.id] = true;
      });
      setExpandedPhases(all);
      setAllExpanded(true);
    }
  };

  // Toggle single phase accordion
  const handleTogglePhase = (id) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle task checkbox
  const handleToggleTask = (taskId) => {
    setCompletedTasks((prev) => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      return updated;
    });
  };

  // Select preset career
  const handleSelectPreset = async (careerTitle) => {
    setTargetCareer(careerTitle);
    setShowCareerSelector(false);
    setIsGenerating(true);
    try {
      const res = await analyticsApi.updateRoadmap({ customCareer: careerTitle });
      if (res && res.success && res.data?.stages) {
        setNotification(`Roadmap dynamically updated for "${careerTitle}".`);
        fetchRoadmap();
      } else {
        setNotification(`Roadmap set to "${careerTitle}".`);
      }
    } catch {
      setNotification(`Roadmap set to "${careerTitle}".`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Removed activePhases declaration as it was moved up before WEEKLY_FOCUS_ITEMS

  // Calculate dynamic progress based on tasks and base completion
  const totalTasksCount = activePhases.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const checkedTasksCount = activePhases.reduce(
    (acc, p) => acc + (p.tasks?.filter((t) => completedTasks[t.id]).length || 0),
    0
  );

  // Dynamic overall progress (0% for new users with no completed tasks)
  const dynamicOverallProgress = totalTasksCount > 0
    ? Math.round((checkedTasksCount / totalTasksCount) * 100)
    : 0;

  // Total topics count
  const allTopics = activePhases.flatMap((p) => p.topics || []);
  const totalTopicsCount = allTopics.length || 0;
  const completedTopicsCount = Math.min(
    totalTopicsCount,
    Math.round((dynamicOverallProgress / 100) * totalTopicsCount)
  );

  // Focus areas summary
  const focusAreasSummary = Array.from(new Set(allTopics)).slice(0, 5).join(", ") || "HTML, CSS, JavaScript, React, APIs";

  return (
    <div
      className="min-h-screen w-full bg-grid"
      style={{
        backgroundColor: "var(--color-bg)",
        backgroundImage:
          "linear-gradient(to right, rgba(27, 51, 44, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(27, 51, 44, 0.04) 1px, transparent 1px), linear-gradient(to right, rgba(27, 51, 44, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(27, 51, 44, 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
      }}
    >
      {/* Toast Notification */}
      {notification && (
        <div
          className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl border p-4 shadow-2xl transition-all sm:right-6"
          style={{ borderColor: "rgba(46, 79, 66, 0.2)", background: "var(--color-surface)", color: "var(--color-text-h)" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8C547]/30 text-[#1B332C]">
              <SparklesIcon className="w-4 h-4" />
            </span>
            <p className="text-xs font-semibold">{notification}</p>
          </div>
        </div>
      )}

      {/* HERO SECTION — UNTOUCHED AS REQUESTED */}
      <HeroSection
        variant="roadmap"
        eyebrow="End-to-End AI Assessment-Driven Guidance"
        title="Your complete path to"
        highlightWord="career readiness."
        description="AIFinity AI analyzes your real assessment scores, weak concepts, mistake patterns, and skill gaps to generate a personalized 0-to-100% sequential roadmap tailored to your performance."
        primaryCta={{ label: "View My Roadmap", href: "#roadmap-content" }}
        secondaryCta={{ label: "Take Assessment", href: "/assessment" }}
      />

      {/* MAIN ROADMAP CONTAINER */}
      <div id="roadmap-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* STAT OVERVIEW CARDS (Career Goal, Total Duration, Total Skills, Focus Areas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Career Goal */}
          <div
            className="group relative rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-md cursor-pointer"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            onClick={() => setShowCareerSelector((prev) => !prev)}
            title="Click to switch career track"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#B91C1C]">
                <span className="text-lg">🎯</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9690]">
                  Career Goal
                </p>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm sm:text-base font-bold text-[#1B332C] truncate">
                    {targetCareer}
                  </p>
                  <span className="text-xs text-[#8B9690] group-hover:text-[#1B332C] transition-colors">
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Switch Dropdown */}
            {showCareerSelector && (
              <div
                className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border p-2 shadow-xl bg-[#FBF8F0] border-[#2E4F42]/20"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8B9690]">
                  Choose Career Track
                </p>
                {PRESET_CAREERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectPreset(c.title)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#1B332C] hover:bg-[#EDE6D3] transition flex items-center justify-between"
                  >
                    <span>{c.icon} {c.title}</span>
                    {targetCareer === c.title && <span className="text-[#2E4F42]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Total Duration */}
          <div
            className="rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-md"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#1D4ED8]">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9690]">
                  Total Duration
                </p>
                <p className="text-sm sm:text-base font-bold text-[#1B332C]">
                  8 Weeks
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Total Skills */}
          <div
            className="rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-md"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#047857]">
                <span className="text-lg">📖</span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9690]">
                  Total Skills
                </p>
                <p className="text-sm sm:text-base font-bold text-[#1B332C]">
                  {totalTopicsCount} Topics
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Focus Areas */}
          <div
            className="rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-md"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#6D28D9]">
                <span className="text-lg">📊</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9690]">
                  Focus Areas
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#1B332C] truncate">
                  {focusAreasSummary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR (Roadmap | This Week | All Tasks | Resources) */}
        <div className="mb-8 border-b border-[#2E4F42]/15">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto pb-px">
            {[
              { id: "roadmap", label: "Roadmap" },
              { id: "this_week", label: "This Week" },
              { id: "all_tasks", label: "All Tasks" },
              { id: "resources", label: "Resources" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-3.5 px-3 text-sm font-bold transition-all duration-200 shrink-0 ${
                    isActive
                      ? "text-[#1B332C]"
                      : "text-[#5B6B5F] hover:text-[#1B332C]"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "var(--color-confirm)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT: LEFT ROADMAP TIMELINE + RIGHT WIDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT MAIN CONTENT (8 COLS) ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header with Title & Expand All */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B332C]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Your Learning Roadmap
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#5B6B5F]">
                  Complete each phase step by step. Each phase builds on the previous one.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold text-[#1B332C] transition-all hover:bg-[#EDE6D3] active:scale-95 shrink-0 self-start sm:self-auto"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                <span>{allExpanded ? "↑ Collapse All" : "↓ Expand All"}</span>
              </button>
            </div>

            {/* TAB: ALL TASKS VIEW */}
            {activeTab === "all_tasks" && (
              <div
                className="rounded-2xl border p-6 shadow-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                <h3 className="text-lg font-bold text-[#1B332C] mb-4">All Actionable Milestones</h3>
                <div className="space-y-4">
                  {activePhases.map((phase) => (
                    <div key={phase.id} className="rounded-xl border p-4 bg-[#EDE6D3]/40 border-[#2E4F42]/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2E4F42]">
                          Phase {phase.phaseNum}: {phase.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#5B6B5F]">{phase.weeks}</span>
                      </div>
                      <div className="space-y-2">
                        {phase.tasks.map((task) => {
                          const isDone = !!completedTasks[task.id];
                          return (
                            <label
                              key={task.id}
                              className="flex items-start gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-white/60 transition"
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleTask(task.id)}
                                className="mt-0.5 h-4 w-4 rounded accent-[#2E4F42] cursor-pointer"
                              />
                              <span
                                className={`text-xs font-medium transition ${
                                  isDone ? "line-through text-[#8B9690]" : "text-[#24413A] group-hover:text-[#1B332C]"
                                }`}
                              >
                                {task.text}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: RESOURCES VIEW */}
            {activeTab === "resources" && (
              <div
                className="rounded-2xl border p-6 shadow-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                <h3 className="text-lg font-bold text-[#1B332C] mb-2">Curated Roadmap Resources</h3>
                <p className="text-xs text-[#5B6B5F] mb-6">
                  Recommended documentation, interactive trainers, and cheat sheets for {targetCareer}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {HELPFUL_RESOURCES.map((res) => (
                    <Link
                      key={res.id}
                      to={res.url}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#2E4F42]/12 bg-[#EDE6D3]/40 hover:bg-[#EDE6D3] hover:scale-[1.01] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{res.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-[#1B332C]">{res.title}</p>
                          <p className="text-[11px] text-[#5B6B5F] capitalize">{res.type} material</p>
                        </div>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-[#2E4F42]" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: THIS WEEK VIEW */}
            {activeTab === "this_week" && (
              <div
                className="rounded-2xl border p-6 shadow-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#1B332C]">This Week's Sprints</h3>
                    <p className="text-xs text-[#5B6B5F]">Focused tasks scheduled for Phase 1 execution.</p>
                  </div>
                  <span className="rounded-full bg-[#E8C547]/30 px-3 py-1 text-xs font-bold text-[#1B332C]">
                    Sprint Active
                  </span>
                </div>
                <div className="space-y-3">
                  {WEEKLY_FOCUS_ITEMS.map((item) => {
                    const isDone = !!completedTasks[item.id];
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[#2E4F42]/10 bg-white/70 hover:bg-white cursor-pointer transition shadow-2xs"
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleTask(item.id)}
                          className="h-4 w-4 rounded accent-[#2E4F42] cursor-pointer"
                        />
                        <span
                          className={`text-xs sm:text-sm font-medium ${
                            isDone ? "line-through text-[#8B9690]" : "text-[#1B332C]"
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: ROADMAP VIEW (Main Stepper Timeline matching reference mockup) */}
            {(activeTab === "roadmap" || activeTab === "this_week") && (
              <div className="relative pl-0 sm:pl-2">
                {/* Stepper Vertical Track */}
                <div
                  className="hidden sm:block absolute left-6 top-8 bottom-8 w-0.5 -z-0"
                  style={{ background: "rgba(46, 79, 66, 0.15)" }}
                />

                <div className="space-y-8">
                  {activePhases.map((phase, idx) => {
                    const isExpanded = !!expandedPhases[phase.id];
                    const isLast = idx === activePhases.length - 1;

                    // Calculate phase task progress
                    const phaseTasks = phase.tasks || [];
                    const completedInPhase = phaseTasks.filter((t) => completedTasks[t.id]).length;
                    const phaseProgress = phaseTasks.length > 0
                      ? Math.round((completedInPhase / phaseTasks.length) * 100)
                      : phase.baseProgress || 0;

                    // Priority color mapping aligned to current theme
                    const priorityConfig = {
                      High: {
                        bg: "#FEE2E2",
                        text: "#B91C1C",
                        border: "rgba(220, 38, 38, 0.25)",
                        label: "High Priority",
                      },
                      Medium: {
                        bg: "#FBF3DC",
                        text: "#B9860F",
                        border: "rgba(217, 166, 43, 0.35)",
                        label: "Medium Priority",
                      },
                      Low: {
                        bg: "#EDE6D3",
                        text: "#5B6B5F",
                        border: "rgba(46, 79, 66, 0.15)",
                        label: "Low Priority",
                      },
                    }[phase.priority] || {
                      bg: "#EDE6D3",
                      text: "#5B6B5F",
                      border: "rgba(46, 79, 66, 0.15)",
                      label: "Standard Priority",
                    };

                    return (
                      <div key={phase.id} className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                        {/* Step Marker on the Left */}
                        <div className="relative z-10 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1.5 shrink-0">
                          {/* Numbered Circle Badge */}
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-sm border-2 shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                              phaseProgress === 100
                                ? "bg-[#2E4F42] text-white border-[#2E4F42]"
                                : idx === 0
                                ? "bg-[#D9A62B] text-[#1B332C] border-[#B9860F] ring-4 ring-[#E8C547]/25"
                                : "bg-[#EDE6D3] text-[#5B6B5F] border-[#2E4F42]/20"
                            }`}
                          >
                            {phaseProgress === 100 ? "✓" : phase.phaseNum}
                          </div>

                          {/* Phase Label & Weeks under step circle */}
                          <div className="text-left sm:text-center sm:w-20">
                            <p className="text-xs font-bold text-[#1B332C]">Phase {phase.phaseNum}</p>
                            <p className="text-[11px] font-mono text-[#8B9690]">{phase.weeks}</p>
                          </div>
                        </div>

                        {/* Phase Card */}
                        <div
                          className="flex-1 rounded-2xl border transition-all duration-300 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] overflow-hidden"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                        >
                          {/* Phase Card Header / Toggle Row */}
                          <div
                            className="p-5 sm:p-6 cursor-pointer flex flex-col gap-3"
                            onClick={() => handleTogglePhase(phase.id)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* Title & Priority Badge */}
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h3
                                  className="text-lg sm:text-xl font-bold text-[#1B332C]"
                                  style={{ fontFamily: "var(--font-display)" }}
                                >
                                  {phase.title}
                                </h3>

                                <span
                                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border"
                                  style={{
                                    backgroundColor: priorityConfig.bg,
                                    color: priorityConfig.text,
                                    borderColor: priorityConfig.border,
                                  }}
                                >
                                  {priorityConfig.label}
                                </span>
                              </div>

                              {/* Progress bar + percentage + Chevron */}
                              <div className="flex items-center gap-3 self-end sm:self-auto">
                                <div className="w-24 sm:w-32 flex items-center gap-2">
                                  <div className="h-2 flex-1 rounded-full bg-[#EDE6D3] overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${phaseProgress}%`,
                                        background: phaseProgress > 0 ? "var(--color-confirm)" : "transparent",
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-[#1B332C] min-w-[28px] text-right font-mono">
                                    {phaseProgress}%
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  className="text-[#8B9690] hover:text-[#1B332C] transition-colors p-1"
                                  aria-label={isExpanded ? "Collapse phase" : "Expand phase"}
                                >
                                  {isExpanded ? "▲" : "▼"}
                                </button>
                              </div>
                            </div>

                            {/* Phase description */}
                            <p className="text-xs sm:text-sm text-[#5B6B5F] leading-relaxed">
                              {phase.description}
                            </p>
                          </div>

                          {/* Expanded Content: Topics, Sample Tasks, CTA Button */}
                          {isExpanded && (
                            <div
                              className="px-5 sm:px-6 pb-6 pt-2 border-t flex flex-col gap-5"
                              style={{ borderColor: "rgba(46, 79, 66, 0.08)" }}
                            >
                              {/* Topics in this phase */}
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9690] mb-2.5">
                                  Topics in this phase:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {phase.topics?.map((topic) => {
                                    const docUrl = getPrimaryDocUrl(topic);
                                    return (
                                      <a
                                        key={topic}
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Open official documentation for ${topic}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:bg-[#1B332C] hover:text-[#E8C547] hover:border-[#1B332C] hover:scale-105 group"
                                        style={{
                                          borderColor: "rgba(46, 79, 66, 0.12)",
                                          background: "var(--color-surface-secondary)",
                                          color: "var(--color-text-body)",
                                        }}
                                      >
                                        <span>{topic}</span>
                                        <span className="text-[10px] opacity-60 group-hover:opacity-100">↗</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Sample Tasks / Actionable Checklist */}
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9690] mb-2.5">
                                  Sample Tasks:
                                </p>
                                <div className="space-y-2">
                                  {phase.tasks?.map((task) => {
                                    const isDone = !!completedTasks[task.id];
                                    return (
                                      <label
                                        key={task.id}
                                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#EDE6D3]/50 cursor-pointer transition select-none"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isDone}
                                          onChange={() => handleToggleTask(task.id)}
                                          className="mt-0.5 h-4 w-4 rounded accent-[#2E4F42] cursor-pointer"
                                        />
                                        <span
                                          className={`text-xs sm:text-sm font-medium transition ${
                                            isDone
                                              ? "line-through text-[#8B9690]"
                                              : "text-[#24413A]"
                                          }`}
                                        >
                                          {task.text}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Assessment Why Insight */}
                              {phase.why && (
                                <div
                                  className="rounded-xl border p-3.5 text-xs"
                                  style={{
                                    borderColor: "rgba(217, 166, 43, 0.3)",
                                    background: "rgba(251, 243, 220, 0.6)",
                                    color: "var(--color-text-h)",
                                  }}
                                >
                                  <span className="font-bold text-[#B9860F] block mb-0.5">
                                    💡 Why this milestone matters:
                                  </span>
                                  <p className="text-[#5B6B5F]">{phase.why}</p>
                                </div>
                              )}

                              {/* ===== 3-STEP LEARNING FLOW CTA ===== */}
                              <div className="pt-4 border-t border-[#2E4F42]/08 mt-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B9690] mb-3">Your Learning Path for This Phase</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Step 1A: Official Documentation Link */}
                                  <a
                                    href={getPrimaryDocUrl(phase.topics?.[0] || phase.title)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs"
                                    style={{ background: "#EDE6D3", color: "#1B332C", border: "1px solid rgba(46,79,66,0.18)" }}
                                  >
                                    <span>📖</span>
                                    <span>1. Read Official Docs ↗</span>
                                  </a>

                                  {/* Step 1B: Study Hub & Resources */}
                                  <Link
                                    to={`/resources/handbook?topic=${encodeURIComponent(phase.topics?.[0] || phase.title)}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 hover:bg-[#E8C547]/20 text-[#1B332C] border border-[#2E4F42]/15"
                                  >
                                    <span>📚</span>
                                    <span>Study Hub</span>
                                  </Link>

                                  {/* Step 2: Build */}
                                  <Link
                                    to={`/resources/project-ideas?topic=${encodeURIComponent(phase.topics?.[0] || phase.title)}&difficulty=${phase.priority === "High" ? "Beginner" : phase.priority === "Medium" ? "Intermediate" : "Advanced"}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                                    style={{ background: "#DBEAFE", color: "#1D4ED8", border: "1px solid rgba(29,78,216,0.15)" }}
                                  >
                                    <span>💡</span>
                                    <span>2. Build a Project</span>
                                  </Link>

                                  {/* Step 3: Test */}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleTestKnowledge(phase); }}
                                    disabled={continueLearningLoading === phase.id}
                                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                                    style={{ background: "#1B332C", color: "#E8C547", border: "1px solid rgba(46,79,66,0.3)" }}
                                  >
                                    {continueLearningLoading === phase.id ? (
                                      <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Preparing…</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>⚡</span>
                                        <span>3. Test Knowledge</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================= RIGHT SIDEBAR WIDGETS (4 COLS) ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Widget 1: Overall Progress */}
            <div
              className="rounded-2xl border p-6 shadow-[var(--shadow-card)]"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <h3 className="text-base font-bold text-[#1B332C] mb-6">Overall Progress</h3>

              {/* Circular Progress Gauge */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#EDE6D3"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Active stroke */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="var(--color-confirm)"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={
                        2 * Math.PI * 40 * (1 - dynamicOverallProgress / 100)
                      }
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span
                      className="text-2xl font-extrabold text-[#1B332C]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {dynamicOverallProgress}%
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-xs font-semibold text-[#5B6B5F]">
                  {completedTopicsCount} of {totalTopicsCount} topics completed
                </p>

                <div className="w-full mt-3">
                  <div className="h-2 w-full rounded-full bg-[#EDE6D3] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${dynamicOverallProgress}%`,
                        background: "var(--color-confirm)",
                      }}
                    />
                  </div>
                </div>

                {/* Motivational Quote Block */}
                <div
                  className="w-full mt-6 rounded-xl border p-4 text-center transition-all"
                  style={{
                    borderColor: "rgba(46, 79, 66, 0.12)",
                    background: "var(--color-surface-secondary)",
                  }}
                >
                  <p className="text-xs sm:text-sm font-semibold italic text-[#1B332C]">
                    {dynamicOverallProgress >= 80
                      ? `🏆 You're almost there! ${targetCareer} mastery is within reach.`
                      : dynamicOverallProgress >= 50
                      ? `🔥 Halfway through your ${targetCareer} path — strong momentum!`
                      : dynamicOverallProgress >= 25
                      ? `✨ Great start on your ${targetCareer} journey. Keep building!`
                      : stages.length > 0
                      ? `🚀 Your personalised ${targetCareer} roadmap is ready. Let's go!`
                      : `💡 Complete your first topic to unlock your ${targetCareer} roadmap insights.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Widget 2: This Week's Focus */}
            <div
              className="rounded-2xl border p-6 shadow-[var(--shadow-card)]"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8C547]/30 text-[#1B332C] text-sm">
                  🎯
                </span>
                <h3 className="text-base font-bold text-[#1B332C]">This Week's Focus</h3>
              </div>

              <div className="space-y-3">
                {WEEKLY_FOCUS_ITEMS.map((item) => {
                  const isDone = !!completedTasks[item.id];
                  return (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 cursor-pointer group select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleTask(item.id)}
                        className="mt-0.5 h-4 w-4 rounded accent-[#2E4F42] cursor-pointer"
                      />
                      <span
                        className={`text-xs font-medium transition ${
                          isDone ? "line-through text-[#8B9690]" : "text-[#24413A] group-hover:text-[#1B332C]"
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-5 pt-3 border-t border-[#2E4F42]/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("this_week")}
                  className="text-xs font-bold text-[#2E4F42] hover:text-[#1B332C] flex items-center gap-1 transition"
                >
                  <span>View Full Plan</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Widget 3: Helpful Resources */}
            <div
              className="rounded-2xl border p-6 shadow-[var(--shadow-card)]"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1D4ED8] text-sm">
                  📖
                </span>
                <h3 className="text-base font-bold text-[#1B332C]">Helpful Resources</h3>
              </div>

              <div className="space-y-2.5">
                {HELPFUL_RESOURCES.map((res) => (
                  <Link
                    key={res.id}
                    to={res.url}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#2E4F42]/08 bg-[#EDE6D3]/40 hover:bg-[#EDE6D3] hover:translate-x-1 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{res.icon}</span>
                      <span className="text-xs font-semibold text-[#1B332C] truncate">
                        {res.title}
                      </span>
                    </div>
                    <ArrowRightIcon className="w-3.5 h-3.5 text-[#2E4F42] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Widget 4: Motivational Mini Banner with Summit theme */}
            <div
              className="rounded-2xl border p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md"
              style={{
                borderColor: "rgba(46, 79, 66, 0.15)",
                background: "linear-gradient(145deg, #EDE6D3 0%, #FBF8F0 100%)",
              }}
            >
              <div className="relative z-10">
                <p className="text-sm font-semibold italic text-[#1B332C] leading-snug">
                  "Consistent effort today, a better you tomorrow."
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E4F42]">
                    Daily Momentum
                  </span>
                  <span className="text-2xl">🏔️ ⛳</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM MOTIVATIONAL BANNER */}
        <div
          className="mt-12 rounded-2xl border p-6 text-center transition-all duration-300"
          style={{
            borderColor: "rgba(46, 79, 66, 0.12)",
            background: "var(--color-surface)",
          }}
        >
          <p className="text-xs sm:text-sm font-medium text-[#5B6B5F]">
            "You don't have to be great to start, but you have to start to be great."{" "}
            <span className="inline-block text-[#2E4F42]">💚</span>
          </p>
        </div>
      </div>

      {/* FINAL CTA SECTION */}
      <Section>
        <CtaBanner
          eyebrow="CAREER INTELLIGENCE"
          title="Verify your skills with AIFinity Skill Gap."
          buttonLabel="Explore Skill Gap"
          href="/skill-gap"
        />
      </Section>
    </div>
  );
}
