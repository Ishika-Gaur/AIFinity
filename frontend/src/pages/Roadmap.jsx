import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import Button from "../components/Button";
import Card from "../components/Card";
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";
import { analyticsApi } from "../services/api";

function CheckIcon({ className = "w-4 h-4", style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [hasRoadmap, setHasRoadmap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(1);
  const [notification, setNotification] = useState("");

  const navigate = useNavigate();

  const fetchRoadmap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getRoadmap();
      if (res && res.success && res.data) {
        setHasRoadmap(res.data.hasRoadmap);
        if (res.data.roadmap) {
          setRoadmap(res.data.roadmap);
        }
      }
    } catch (err) {
      console.error("Failed to load personalized roadmap:", err);
      setError("Failed to load your personalized roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleGenerate = async (isRegenerate = false) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = isRegenerate ? await analyticsApi.regenerateRoadmap() : await analyticsApi.generateRoadmap();
      if (res && res.success && res.data) {
        setHasRoadmap(true);
        setRoadmap(res.data.roadmap);
        setNotification("AI Roadmap Generated successfully based on your latest evidence.");
        setTimeout(() => setNotification(""), 4500);
      } else {
        setError(res?.message || "Failed to generate roadmap.");
      }
    } catch (err) {
      if (err.message && err.message.includes("AI_SERVICE_UNAVAILABLE")) {
        setError("AI roadmap generation is temporarily unavailable. Please try again later.");
      } else {
        setError("An unexpected error occurred while generating your roadmap.");
      }
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStepStatus = async (stepId, newStatus) => {
    try {
      const res = await analyticsApi.updateRoadmapStep(stepId, newStatus);
      if (res && res.success) {
        setRoadmap(res.data.roadmap);
      }
    } catch (err) {
      console.error("Failed to update step status:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Loading your personalized roadmap...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Hero Section */}
      <div className="pt-24 pb-12 text-center px-4" style={{ background: "linear-gradient(180deg, var(--color-surface-secondary) 0%, var(--color-bg) 100%)" }}>
        <Container>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-600)" }}>
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>AI-Powered Career Roadmap</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "var(--color-text-h)" }}>
            Your Path to <span style={{ color: "var(--color-primary-600)" }}>{roadmap?.careerGoal || "Success"}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-relaxed mb-8" style={{ color: "var(--color-text-muted)" }}>
            {roadmap?.summary || "A personalized learning plan generated by ConceptRoot AI based on your actual assessment evidence."}
          </p>
          
          {hasRoadmap ? (
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => handleGenerate(true)} disabled={isGenerating} variant="outline" className="flex items-center gap-2">
                {isGenerating ? "Analyzing..." : "Regenerate AI Roadmap"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => handleGenerate(false)} disabled={isGenerating} className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow mx-auto">
              {isGenerating ? "Analyzing your learning history..." : "Generate AI Roadmap"}
            </Button>
          )}

          {error && (
            <div className="mt-6 max-w-md mx-auto p-4 rounded-xl text-sm font-medium border" style={{ background: "#FEF2F2", borderColor: "#FCA5A5", color: "#B91C1C" }}>
              {error}
            </div>
          )}
          {notification && (
            <div className="mt-6 max-w-md mx-auto p-4 rounded-xl text-sm font-medium border" style={{ background: "var(--color-primary-50)", borderColor: "var(--color-primary-200)", color: "var(--color-primary-700)" }}>
              {notification}
            </div>
          )}
        </Container>
      </div>

      {hasRoadmap && roadmap && (
        <Section className="py-12">
          <Container maxWidth="3xl">
            <div className="space-y-6">
              {roadmap.phases?.map((phase, idx) => (
                <div key={idx} className="rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md bg-white" style={{ borderColor: "var(--color-border)" }}>
                  <button
                    onClick={() => setExpandedPhase(expandedPhase === phase.phaseNumber ? null : phase.phaseNumber)}
                    className="w-full text-left p-6 flex items-start gap-4"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 font-bold text-lg" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}>
                      {phase.phaseNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-bold" style={{ color: "var(--color-text-h)" }}>{phase.title}</h3>
                        <ArrowRightIcon className={`w-5 h-5 transition-transform duration-200 ${expandedPhase === phase.phaseNumber ? "rotate-90" : ""}`} style={{ color: "var(--color-text-muted)" }} />
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{phase.description}</p>
                    </div>
                  </button>

                  {expandedPhase === phase.phaseNumber && (
                    <div className="px-6 pb-6 border-t pt-6" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)" }}>
                      <div className="space-y-4">
                        {phase.steps?.map((step, sIdx) => (
                          <div key={sIdx} className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-bold text-base" style={{ color: "var(--color-text-h)" }}>{step.topic}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${step.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                                {step.priority} Priority
                              </span>
                            </div>
                            <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>{step.whyItMatters}</p>
                            
                            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-xs leading-relaxed border border-slate-100">
                              <strong className="text-slate-700">AI Evidence:</strong> {step.reason}
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <span className="block text-xs font-semibold text-slate-500 mb-1">LEARNING OBJECTIVE</span>
                                <p className="text-sm font-medium text-slate-800">{step.learningObjective}</p>
                              </div>
                              <div>
                                <span className="block text-xs font-semibold text-slate-500 mb-1">PRACTICE TASK</span>
                                <p className="text-sm font-medium text-slate-800">{step.practiceTask}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t pt-4 mt-2 border-slate-100">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <ClockIcon className="w-4 h-4" />
                                {step.estimatedTime}
                              </div>
                              <div className="flex gap-2">
                                <select 
                                  value={step.completionStatus} 
                                  onChange={(e) => handleUpdateStepStatus(step.id, e.target.value)}
                                  className="text-xs border rounded-md px-2 py-1 text-slate-700 bg-white"
                                >
                                  <option value="NOT_STARTED">Not Started</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="COMPLETED">Completed</option>
                                </select>
                                <Button 
                                  variant="outline" 
                                  onClick={() => navigate("/practice")}
                                  className="text-xs py-1 px-3"
                                >
                                  Practice
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!phase.steps || phase.steps.length === 0) && (
                          <div className="text-center py-6 text-slate-500 text-sm">
                            No active steps required in this phase currently.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Empty State Fallback handled inline or by hasRoadmap check above */}
      {!hasRoadmap && !isGenerating && !isLoading && (
        <Section className="py-12">
          <Container maxWidth="3xl">
            <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="w-16 h-16 mx-auto bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                <SparklesIcon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text-h)" }}>Your Roadmap is Empty</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Complete an assessment and set a career goal to generate a truly personalized AI learning roadmap based on your actual evidence.
              </p>
              <Button onClick={() => navigate("/assessments")}>
                Take an Assessment
              </Button>
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner
        title="Ready to test your new skills?"
        subtitle="Take an adaptive assessment to update your AI Roadmap with fresh evidence."
        primaryAction={{ label: "Go to Assessments", onClick: () => navigate("/assessments") }}
      />
    </div>
  );
}
