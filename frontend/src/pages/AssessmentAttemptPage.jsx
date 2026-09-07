import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Section from "../components/Section";
import Container from "../components/Container";
import Button from "../components/Button";
import { formatType } from "../utils/constants";
import { createAttemptSession, submitAttemptSession } from "../services/assessmentService";

const CONFIDENCE_OPTIONS = ["Low Confidence", "Medium Confidence", "High Confidence"];
const MAX_VIOLATIONS = 3;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ---------------- Question type renderers ---------------- */

function McqQuestion({ question, response, onAnswer }) {
  if (!Array.isArray(question.options) || question.options.length === 0) {
    return (
      <TextAnswerQuestion
        response={response}
        onAnswer={onAnswer}
        rows={5}
        label="Answer"
        placeholder="Type your answer here..."
      />
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 select-auto">
      {(question.options || []).map((option, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onAnswer(index)}
          aria-pressed={response === index}
          className={`flex w-full items-center rounded-xl border px-4 py-3 text-left transition-colors ${
            response === index
              ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
              : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-600)]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TrueFalseQuestion({ question, response, onAnswer }) {
  const suppliedOptions = Array.isArray(question.options) && question.options.length >= 2;
  const choices = suppliedOptions
    ? question.options.slice(0, 2)
    : ["True", "False"];

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 select-auto">
      {choices.map((choice, index) => {
        const value = suppliedOptions ? index : choice;
        const selected = response === value || String(response).toLowerCase() === String(choice).toLowerCase();

        return (
          <button
            key={choice}
            type="button"
            onClick={() => onAnswer(value)}
            aria-pressed={selected}
            className={`flex min-h-14 w-full items-center justify-center rounded-xl border px-4 py-3 font-semibold transition-colors ${
              selected
                ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                : "border-[var(--color-border)] bg-white text-[var(--color-text-h)] hover:border-[var(--color-primary-600)]"
            }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}

function TextAnswerQuestion({ response, onAnswer, rows, placeholder, label }) {
  return (
    <textarea
      value={response || ""}
      onChange={(e) => onAnswer(e.target.value)}
      rows={rows}
      aria-label={label}
      placeholder={placeholder}
      className="mt-6 block min-h-32 w-full resize-y rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm leading-relaxed text-[var(--color-text-h)] placeholder:text-[var(--color-text-light)] shadow-sm select-auto focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
    />
  );
}

function ScenarioQuestion(props) {
  return <McqQuestion {...props} />;
}

function LogicalReasoningQuestion(props) {
  return <McqQuestion {...props} />;
}

function DataInterpretationQuestion(props) {
  return <McqQuestion {...props} />;
}

function ConceptualQuestion({ response, onAnswer }) {
  return <TextAnswerQuestion response={response} onAnswer={onAnswer} rows={6} label="Conceptual answer" placeholder="Type your explanation here..." />;
}

function ProblemSolvingQuestion({ response, onAnswer }) {
  return <TextAnswerQuestion response={response} onAnswer={onAnswer} rows={7} label="Problem-solving answer" placeholder="Walk through your approach here..." />;
}

function CodingQuestion({ response, onAnswer }) {
  return (
    <textarea
      value={response || ""}
      onChange={(e) => onAnswer(e.target.value)}
      rows={10}
      spellCheck={false}
      placeholder="// write your code here"
      className="mt-6 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-navy)] px-4 py-3 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]/30"
    />
  );
}

function OutputQuestion({ response, onAnswer }) {
  return (
    <input
      type="text"
      value={response || ""}
      onChange={(e) => onAnswer(e.target.value)}
      placeholder="Type the expected output..."
      className="mt-6 w-full rounded-md border border-[var(--color-border)] bg-white px-4 py-3 font-mono text-sm text-[var(--color-text-h)] placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
    />
  );
}

function normalizeQuestionType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[\s-]+/g, "-");

  const aliases = {
    "multiple-choice": "mcq",
    "multiple-choice-question": "mcq",
    "multiple-choice-questions": "mcq",
    "true-false": "true-false",
    "short-answer": "short-answer",
    "long-answer": "long-answer",
  };

  return aliases[normalized] || normalized;
}

function QuestionBody({ question, response, onAnswer }) {
  switch (normalizeQuestionType(question.type)) {
    case "mcq":
      return <McqQuestion question={question} response={response} onAnswer={onAnswer} />;
    case "true-false":
      return <TrueFalseQuestion question={question} response={response} onAnswer={onAnswer} />;
    case "short-answer":
      return <TextAnswerQuestion response={response} onAnswer={onAnswer} rows={5} label="Short answer" placeholder="Type your answer here..." />;
    case "long-answer":
      return <TextAnswerQuestion response={response} onAnswer={onAnswer} rows={9} label="Long answer" placeholder="Type your answer here..." />;
    case "scenario":
      return <ScenarioQuestion question={question} response={response} onAnswer={onAnswer} />;
    case "logical-reasoning":
      return <LogicalReasoningQuestion question={question} response={response} onAnswer={onAnswer} />;
    case "data-interpretation":
      return <DataInterpretationQuestion question={question} response={response} onAnswer={onAnswer} />;
    case "problem-solving":
      return <ProblemSolvingQuestion response={response} onAnswer={onAnswer} />;
    case "conceptual":
      return <ConceptualQuestion response={response} onAnswer={onAnswer} />;
    case "coding":
      return <CodingQuestion response={response} onAnswer={onAnswer} />;
    case "output":
      return <OutputQuestion response={response} onAnswer={onAnswer} />;
    default:
      return <TextAnswerQuestion response={response} onAnswer={onAnswer} rows={6} label="Answer" placeholder="Type your answer here..." />;
  }
}

export default function AssessmentAttemptPage() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);

  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState({});
  const [confidence, setConfidence] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Security & Anti-Cheat States
  const [violations, setViolations] = useState([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [securityWarning, setSecurityWarning] = useState("");

  // Submitting / Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);

  const attemptContainerRef = useRef(null);

  // Initialize fresh, randomized attempt session
  const initAttempt = useCallback(async () => {
    setLoadingAssessment(true);
    setCompleted(false);
    setResultData(null);
    setResponses({});
    setConfidence({});
    setElapsedSeconds(0);
    setViolations([]);
    setCurrent(0);

    const res = await createAttemptSession(id);
    if (res.success) {
      setAssessment(res.assessment);
      setAttemptId(res.attemptId);
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(`aifinity_active_attempt_${id}`, "true");
      }
    } else {
      setAssessment(null);
    }
    setLoadingAssessment(false);
  }, [id]);

  useEffect(() => {
    initAttempt();
  }, [initAttempt]);

  // Elapsed time timer
  useEffect(() => {
    if (completed || loadingAssessment || !assessment) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [completed, loadingAssessment, assessment]);

  const handleFinalSubmitRef = useRef(null);

  // Submit assessment and evaluate answers securely
  const handleFinalSubmit = useCallback(
    async (overrideViolations) => {
      if (isSubmitting || completed) return;
      setIsSubmitting(true);

      const activeViolations = overrideViolations || violations;
      const result = await submitAttemptSession(
        id,
        attemptId,
        responses,
        elapsedSeconds,
        activeViolations
      );

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(`aifinity_active_attempt_${id}`);
      }

      setResultData(result);
      setCompleted(true);
      setIsSubmitting(false);
    },
    [isSubmitting, completed, violations, id, attemptId, responses, elapsedSeconds]
  );

  useEffect(() => {
    handleFinalSubmitRef.current = handleFinalSubmit;
  }, [handleFinalSubmit]);

  // Helper to record a security violation
  const addViolation = useCallback(
    (reason) => {
      if (completed) return;
      const newRecord = { timestamp: new Date().toLocaleTimeString(), reason };

      setViolations((prev) => {
        const nextViolations = [...prev, newRecord];
        const count = nextViolations.length;

        setSecurityWarning(
          `⚠️ Security Notice (${count}/${MAX_VIOLATIONS}): ${reason}`
        );

        if (count >= MAX_VIOLATIONS) {
          setTimeout(() => {
            if (handleFinalSubmitRef.current) {
              handleFinalSubmitRef.current(nextViolations);
            }
          }, 300);
        }
        return nextViolations;
      });
    },
    [completed]
  );

  // ---------------- ANTI-CHEAT & SECURITY LISTENERS ----------------
  useEffect(() => {
    if (completed || loadingAssessment || !assessment) return;

    // 1. Tab visibility and Window Blur Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        addViolation("Tab switched / hidden window detected");
      }
    };

    const handleWindowBlur = () => {
      setIsBlurred(true);
      addViolation("Window focus lost or screen capture attempt");
    };

    // 2. Fullscreen status detection
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (!isFS && !completed) {
        addViolation("Exited fullscreen security mode");
      }
    };

    // 3. Prohibited key shortcuts (PrintScreen, Ctrl+P, F12, DevTools)
    const handleKeyDown = (e) => {
      // PrintScreen Key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        try {
          navigator.clipboard?.writeText("");
        } catch (_) {}
        addViolation("Screenshot command (PrintScreen) intercepted");
      }

      // Ctrl/Cmd + P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        addViolation("Print command (Ctrl+P) blocked");
      }

      // Ctrl/Cmd + S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        addViolation("Save page command blocked");
      }

      // DevTools Shortcuts: F12, Ctrl+Shift+I/J/C, Ctrl+U
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U"))
      ) {
        e.preventDefault();
        addViolation("Inspect/DevTools key shortcut blocked");
      }
    };

    // 4. Copy / Cut / ContextMenu Prevention
    const handleCopyCut = (e) => {
      e.preventDefault();
      setSecurityWarning("⚠️ Copying and cutting text is disabled during assessments.");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      setSecurityWarning("⚠️ Right-click context menu is disabled during assessments.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopyCut);
    document.addEventListener("cut", handleCopyCut);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopyCut);
      document.removeEventListener("cut", handleCopyCut);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [completed, loadingAssessment, assessment, addViolation]);

  // Request Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };



  if (loadingAssessment) {
    return (
      <Section className="py-24">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#1B332C] border-t-transparent"></div>
            <p className="font-medium text-[var(--color-text-muted)]">
              Generating fresh randomized assessment attempt...
            </p>
          </div>
        </Container>
      </Section>
    );
  }

  if (!assessment) {
    return (
      <Section className="py-24">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text-h)]">Assessment not found</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              This assessment may have been moved or doesn't exist.
            </p>
            <Button as={Link} to="/assessment" className="mt-6">
              Back to Assessments
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  const questions = assessment.questions || [];
  const question = questions[current] || {};
  const answeredCount = Object.keys(responses).length;

  function setAnswer(value) {
    setResponses((prev) => ({ ...prev, [question.id]: value }));
  }

  function setQuestionConfidence(level) {
    setConfidence((prev) => ({ ...prev, [question.id]: level }));
  }

  function goTo(index) {
    setCurrent(Math.max(0, Math.min(index, questions.length - 1)));
  }

  /* ---------------- RESULTS VIEW ---------------- */
  if (completed && resultData) {
    const totalQuestions = resultData.totalQuestions || (assessment?.questions?.length || 1);
    const attemptedCount =
      resultData.attemptedCount ??
      resultData.answeredCount ??
      Math.max(0, totalQuestions - (resultData.unansweredCount || 0));
    const correctCount = resultData.correctCount ?? 0;
    const incorrectCount = resultData.incorrectCount ?? 0;
    const unansweredCount = resultData.unansweredCount ?? Math.max(0, totalQuestions - attemptedCount);
    const unansweredTotalCount = resultData.unansweredTotalCount ?? unansweredCount;
    const scorePercent = resultData.scorePercent ?? resultData.percentage ?? 0;
    const autoSubmitted = Boolean(resultData.autoSubmitted);
    const overallFeedback = resultData.overallFeedback;
    const overallRating = resultData.overallRating;
    const strengths = Array.isArray(resultData.strengths) ? resultData.strengths : [];
    const areasToImprove = Array.isArray(resultData.areasToImprove) ? resultData.areasToImprove : [];

    return (
      <Section className="py-16 bg-[#FBF8F0] min-h-screen">
        <Container>
          <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-md ${
                autoSubmitted
                  ? "bg-red-100 text-red-600 border border-red-200"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              {autoSubmitted ? "⚠️" : "✓"}
            </span>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1B332C] sm:text-4xl">
                {autoSubmitted ? "Assessment Auto-Submitted" : "Assessment Completed!"}
              </h1>
              {autoSubmitted && (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 inline-block">
                  Auto-Submitted due to 3 Security Violations
                </p>
              )}
            </div>

            <div className="mt-2 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBlock label="Score" value={`${scorePercent}%`} />
              <StatBlock label="Attempted" value={`${attemptedCount}/${totalQuestions}`} />
              <StatBlock label="Correct" value={`${correctCount}/${attemptedCount > 0 ? attemptedCount : totalQuestions}`} />
              <StatBlock label="Time Taken" value={formatTime(elapsedSeconds)} />
            </div>

            {/* AI Evaluation Diagnostic Card */}
            {overallFeedback && (
              <div className="w-full text-left rounded-2xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)]/40 p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--color-primary-100)] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary-600)] text-white text-xs font-bold shadow-xs">
                      AI
                    </span>
                    <h3 className="text-sm font-bold text-[var(--color-text-h)]">
                      AI Diagnostic Evaluation
                    </h3>
                  </div>
                  {overallRating && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        overallRating === "Excellent" || overallRating === "Good"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : overallRating === "Average"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {overallRating}
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-[var(--color-text-body)] mb-4">
                  {overallFeedback}
                </p>

                {strengths.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1.5">
                      ✓ Key Strengths
                    </span>
                    <ul className="space-y-1 text-xs text-emerald-900">
                      {strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {areasToImprove.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1.5">
                      🎯 Recommended Focus
                    </span>
                    <ul className="space-y-1 text-xs text-amber-900">
                      {areasToImprove.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Result Breakdown */}
            <div className="w-full text-left rounded-xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                Result Breakdown
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Total Questions</span>
                  <span className="font-semibold text-[var(--color-text-h)]">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Attempted</span>
                  <span className="font-semibold text-[var(--color-text-h)]">{attemptedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Correct</span>
                  <span className="font-semibold text-green-600">{correctCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Incorrect</span>
                  <span className="font-semibold text-red-600">{incorrectCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Unanswered (Gradable)</span>
                  <span className="font-semibold text-amber-600">{unansweredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Unanswered (Total)</span>
                  <span className="font-semibold text-[var(--color-text-muted)]">{unansweredTotalCount}</span>
                </div>
              </div>
            </div>

            {/* Violation History Summary */}
            {violations.length > 0 && (
              <div className="w-full text-left rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                  Security Log ({violations.length} Warning{violations.length > 1 ? "s" : ""})
                </p>
                <ul className="space-y-1 text-xs text-amber-900">
                  {violations.map((v, i) => (
                    <li key={i} className="flex justify-between border-b border-amber-200/50 pb-1">
                      <span>• {v.reason}</span>
                      <span className="font-mono text-amber-700">{v.timestamp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Question-by-Question Review with AI Feedback */}
            {Array.isArray(resultData.questionResults) && resultData.questionResults.length > 0 && (
              <div className="w-full text-left rounded-xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                  Question Review & AI Feedback
                </p>
                <div className="space-y-3">
                  {resultData.questionResults.map((qr, idx) => (
                    <div
                      key={qr.questionId || idx}
                      className={`p-3 rounded-lg border text-xs ${
                        qr.status === "correct"
                          ? "border-emerald-200 bg-emerald-50/40"
                          : qr.status === "partial"
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-rose-200 bg-rose-50/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[var(--color-text-h)]">
                          Q{idx + 1}. {qr.concept ? `[${qr.concept}]` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            qr.status === "correct"
                              ? "bg-emerald-100 text-emerald-800"
                              : qr.status === "partial"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {qr.status} ({qr.marksAwarded ?? 0}/10)
                        </span>
                      </div>
                      <p className="text-[var(--color-text-body)] mb-2 font-medium">
                        {qr.questionText}
                      </p>
                      <div className="space-y-1 text-[11px]">
                        <div>
                          <span className="font-semibold text-[var(--color-text-muted)]">Your Answer: </span>
                          <span className="font-mono text-[var(--color-text-h)]">{qr.userAnswer || "[Unanswered]"}</span>
                        </div>
                        {qr.correctAnswer && qr.correctAnswer !== "N/A" && qr.status !== "correct" && (
                          <div>
                            <span className="font-semibold text-emerald-700">Correct Answer: </span>
                            <span className="font-mono text-emerald-900">{qr.correctAnswer}</span>
                          </div>
                        )}
                        {(qr.aiFeedback || qr.explanation) && (
                          <div className="mt-1 pt-1 border-t border-[var(--color-border)]/50 text-[var(--color-text-muted)]">
                            <span className="font-semibold text-[var(--color-primary-700)]">AI Feedback: </span>
                            {qr.aiFeedback || qr.explanation}
                          </div>
                        )}
                        {Array.isArray(qr.keyPointsMissed) && qr.keyPointsMissed.length > 0 && (
                          <div className="text-amber-800">
                            <span className="font-semibold">Key Points Missed: </span>
                            {qr.keyPointsMissed.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5B6B5F]">
              Your performance telemetry has been evaluated securely. Answers were validated on the server.
            </p>

            <div className="flex flex-wrap justify-center gap-3 w-full">
              <Button onClick={initAttempt} variant="outline" size="md">
                🔄 Start Fresh Attempt
              </Button>
              <Button as={Link} to="/dashboard" size="md">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  /* ---------------- ATTEMPT VIEW ---------------- */
  return (
    <div
      ref={attemptContainerRef}
      className="relative min-h-screen bg-white select-none"
      style={{
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none",
      }}
    >
      {/* Print stylesheet deterrence */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>

      {/* SCREEN BLUR / FOCUS LOST PROTECTION SHIELD */}
      {isBlurred && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1B332C]/95 backdrop-blur-md p-6 text-center text-white">
          <div className="rounded-2xl border border-[#D9A62B]/40 bg-[#1B332C] p-8 shadow-2xl max-w-md">
            <span className="text-4xl">⚠️</span>
            <h2 className="mt-4 text-2xl font-bold text-[#E8C547]">Assessment Content Protected</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Window focus lost or tab switched. Assessment content is hidden for security deterrence.
            </p>
            <p className="mt-4 text-xs font-mono text-[#D9A62B]">
              Return to window and click Resume Assessment.
            </p>
            <Button
              onClick={() => setIsBlurred(false)}
              className="mt-6 w-full shadow-lg"
            >
              Resume Assessment
            </Button>
          </div>
        </div>
      )}

      {/* TOP SECURITY BAR */}
      <div className="border-b border-[#2E4F42]/15 bg-[#1B332C] px-4 py-2.5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 font-mono font-semibold text-emerald-300 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Anti-Cheat Active
            </span>
            <span className="hidden sm:inline text-slate-300">
              🔒 Dynamic Questions · Copy & Screenshot Protection Active
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            {/* Warning Counter */}
            <span
              className={`rounded-full px-2.5 py-1 font-bold ${
                violations.length >= 2
                  ? "bg-red-500/30 text-red-300 border border-red-400/40"
                  : violations.length === 1
                  ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
            >
              Warnings: {violations.length}/{MAX_VIOLATIONS}
            </span>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700 transition"
            >
              {isFullscreen ? "Exit Fullscreen" : "⛶ Fullscreen"}
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY WARNING TOAST */}
      {securityWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-900 flex items-center justify-center gap-2">
          <span>{securityWarning}</span>
          <button
            onClick={() => setSecurityWarning("")}
            className="ml-2 font-bold text-amber-700 hover:text-amber-950"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN QUESTION SECTION */}
      <Section background="white" containerSize="wide" className="py-8">
          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] xl:grid-cols-[minmax(0,1fr)_280px]">
            <main className="min-w-0">
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  disabled={current === 0}
                  className="text-sm font-medium text-[var(--color-primary-600)] disabled:opacity-30"
                >
                  ← Previous
                </button>
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Question {current + 1} of {questions.length}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary-600)]">
                  {formatType(question.type)}
                </span>
                {question.difficulty && (
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {question.difficulty}
                  </span>
                )}
              </div>

              {question.context && (
                <p className="mt-3 rounded-lg bg-[var(--color-surface-secondary)] px-4 py-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {question.context}
                </p>
              )}

              <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-[var(--color-text-h)] sm:text-3xl">
                {question.question}
              </h1>

              <QuestionBody
                question={question}
                response={responses[question.id]}
                onAnswer={setAnswer}
              />

              {/* Confidence level */}
              {responses[question.id] !== undefined && responses[question.id] !== "" && (
                <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
                  <p className="mb-3 text-sm font-medium text-[var(--color-text-h)]">
                    How confident are you?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_OPTIONS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setQuestionConfidence(level)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          confidence[question.id] === level
                            ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white"
                            : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-primary-300)]"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom nav */}
              <div className="mt-10 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
                <Button
                  variant="outline"
                  onClick={() => goTo(current - 1)}
                  disabled={current === 0}
                >
                  Previous
                </Button>

                {current === questions.length - 1 ? (
                  <Button onClick={() => handleFinalSubmit()} disabled={isSubmitting}>
                    {isSubmitting ? "Evaluating..." : "Submit Assessment"}
                  </Button>
                ) : (
                  <Button onClick={() => goTo(current + 1)}>Next</Button>
                )}
              </div>
            </main>

            {/* Side panel */}
            <aside className="min-w-0 w-full lg:sticky lg:top-8 lg:self-start">
              <div className="w-full rounded-xl border border-[var(--color-border)] p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--color-text-h)]">
                    Time Elapsed
                  </span>
                  <span className="font-mono text-sm font-semibold text-[var(--color-primary-600)]">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Progress</span>
                    <span>
                      {answeredCount}/{questions.length}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary-600)] transition-all duration-300"
                      style={{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const answered = responses[q.id] !== undefined && responses[q.id] !== "";
                    const isCurrent = index === current;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => goTo(index)}
                        className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                          isCurrent
                            ? "bg-[var(--color-primary-600)] text-white"
                            : answered
                            ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border border-[var(--color-primary-100)]"
                            : "bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">🔒 Protection Rules</p>
                  <p>• Do not switch tabs or minimize window.</p>
                  <p>• Copying, screenshot shortcuts, & right click are disabled.</p>
                  <p>• Exceeding 3 warnings causes automatic submission.</p>
                </div>
              </div>
            </aside>
          </div>
      </Section>
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-4">
      <span className="text-xl font-bold text-[var(--color-text-h)]">{value}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}
