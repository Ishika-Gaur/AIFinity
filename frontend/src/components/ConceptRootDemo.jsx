import React, { useState } from "react";
import Button from "./Button";
import { conceptRootApi } from "../services/api";

const SAMPLE_SCENARIOS_NORMAL = [
  {
    id: "binary-search",
    title: "Binary Search Complexity",
    category: "Algorithm Analysis",
    question: "What is the time complexity of Binary Search on a sorted array of size n?",
    userAnswer: "It is O(n) because it checks each element in the array one by one.",
  },
  {
    id: "recursion-base-case",
    title: "Recursion Base Case",
    category: "Recursion Boundary",
    question: "Why does recursive factorial(n) cause a stack overflow when given negative numbers like n = -5?",
    userAnswer: "Because negative numbers don't have factorials in math and the recursion keeps calling itself.",
  },
  {
    id: "quicksort-selection",
    title: "QuickSort vs Selection Sort",
    category: "Reasoning Depth",
    question: "Which sorting algorithm is faster on average: Selection Sort or QuickSort?",
    userAnswer: "QuickSort is faster because Selection Sort uses two loops and QuickSort uses only one loop.",
  },
  {
    id: "hash-table-lookup",
    title: "Hash Table Lookup",
    category: "Direct Mapping",
    question: "Why does a hash table achieve O(1) average time complexity for lookups?",
    userAnswer: "The hash function converts the key directly into an array index in O(1) time, allowing direct memory access to the bucket without scanning items.",
  },
];

const SAMPLE_SCENARIOS_CODE = [
  {
    id: "array-max-bug",
    title: "Array Maximum Bug",
    category: "Boundary Bug",
    code: `function findMax(arr) {
  let max = 0; // Bug: fails for arrays with negative numbers only

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}`,
  },
  {
    id: "async-foreach-bug",
    title: "Async in forEach",
    category: "Async Flow",
    code: `async function saveAllUsers(users) {
  // Bug: forEach does not await async operations
  users.forEach(async (user) => {
    await db.save(user);
  });
  console.log("Finished saving all users");
}`,
  },
  {
    id: "clean-binary-search",
    title: "Binary Search Code",
    category: "Optimal Logic",
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}`,
  },
];

export default function ConceptRootDemo({ className = "" }) {
  const [mode, setMode] = useState("normal"); // 'normal' | 'code'

  // Normal answer state
  const [selectedScenarioId, setSelectedScenarioId] = useState(SAMPLE_SCENARIOS_NORMAL[0].id);
  const [questionText, setQuestionText] = useState(SAMPLE_SCENARIOS_NORMAL[0].question);
  const [userAnswerText, setUserAnswerText] = useState(SAMPLE_SCENARIOS_NORMAL[0].userAnswer);

  // Code submission state
  const [codeScenarioId, setCodeScenarioId] = useState(SAMPLE_SCENARIOS_CODE[0].id);
  const [codeText, setCodeText] = useState(SAMPLE_SCENARIOS_CODE[0].code);

  // Interactive flow state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Switch modes
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setIsLoading(false);
    setErrorMsg("");
    setResult(null);
    setHasAnalyzed(false);
    if (newMode === "normal") {
      const scenario =
        SAMPLE_SCENARIOS_NORMAL.find((p) => p.id === selectedScenarioId) ||
        SAMPLE_SCENARIOS_NORMAL[0];
      setQuestionText(scenario.question);
      setUserAnswerText(scenario.userAnswer);
    } else {
      const scenario =
        SAMPLE_SCENARIOS_CODE.find((p) => p.id === codeScenarioId) ||
        SAMPLE_SCENARIOS_CODE[0];
      setCodeText(scenario.code);
    }
  };

  // Select Normal Answer Preset
  const handleSelectNormalPreset = (scenario) => {
    setSelectedScenarioId(scenario.id);
    setQuestionText(scenario.question);
    setUserAnswerText(scenario.userAnswer);
    setResult(null);
    setHasAnalyzed(false);
    setErrorMsg("");
  };

  // Select Code Preset
  const handleSelectCodePreset = (scenario) => {
    setCodeScenarioId(scenario.id);
    setCodeText(scenario.code);
    setResult(null);
    setHasAnalyzed(false);
    setErrorMsg("");
  };

  // Run live diagnostic analysis via backend Gemini AI
  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setHasAnalyzed(false);

    try {
      const payload =
        mode === "normal"
          ? {
              mode: "normal",
              question: questionText,
              userAnswer: userAnswerText,
            }
          : {
              mode: "code",
              code: codeText,
            };

      const res = await conceptRootApi.analyze(payload);
      if (res.success && res.data) {
        setResult(res.data);
        setHasAnalyzed(true);
      } else {
        setErrorMsg(res.error || res.message || "Failed to analyze submission with ConceptRoot AI.");
      }
    } catch (err) {
      console.error("ConceptRoot AI diagnostic error:", err);
      setErrorMsg("Network error: Could not reach the ConceptRoot diagnostic service.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setHasAnalyzed(false);
    setIsLoading(false);
    setResult(null);
    setErrorMsg("");
    if (mode === "normal") {
      const scenario = SAMPLE_SCENARIOS_NORMAL[0];
      setSelectedScenarioId(scenario.id);
      setQuestionText(scenario.question);
      setUserAnswerText(scenario.userAnswer);
    } else {
      const scenario = SAMPLE_SCENARIOS_CODE[0];
      setCodeScenarioId(scenario.id);
      setCodeText(scenario.code);
    }
  };

  // Verdict Badge Helper (Supports 5 Verdict States)
  const renderVerdictBadge = (verdict) => {
    switch (verdict) {
      case "Correct":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Correct
          </span>
        );
      case "Partially Correct":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            ~ Partially Correct
          </span>
        );
      case "Correct with Weakness":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            ⚠ Correct with Weakness
          </span>
        );
      case "Incorrect":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            ✕ Incorrect
          </span>
        );
      case "Ambiguous":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            ? Ambiguous Input
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card-hover)] overflow-hidden ${className}`}
    >
      {/* Header & Mode Switcher */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-primary-50)]/50 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-100)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-700)]">
              Live AI ConceptRoot Diagnostic
            </span>
            <h3 className="mt-2 text-xl font-bold text-[var(--color-text-h)]">
              Test ConceptRoot Diagnostic Engine
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Submit an explanation or code snippet to receive live 8-field root cause analysis from Gemini AI.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="inline-flex items-center rounded-xl bg-white p-1.5 border border-[var(--color-border)] shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => handleModeSwitch("normal")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                mode === "normal"
                  ? "bg-[var(--color-primary-600)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-h)]"
              }`}
            >
              Conceptual Answer
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("code")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                mode === "code"
                  ? "bg-[var(--color-primary-600)] text-white shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-h)]"
              }`}
            >
              Code Submission
            </button>
          </div>
        </div>

        {/* Preset Selector Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Example Scenarios:
          </span>
          {mode === "normal"
            ? SAMPLE_SCENARIOS_NORMAL.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectNormalPreset(scenario)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                    selectedScenarioId === scenario.id
                      ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold shadow-xs"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-primary-300)]"
                  }`}
                >
                  {scenario.category || scenario.title}
                </button>
              ))
            : SAMPLE_SCENARIOS_CODE.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectCodePreset(scenario)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                    codeScenarioId === scenario.id
                      ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold shadow-xs"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-primary-300)]"
                  }`}
                >
                  {scenario.category || scenario.title}
                </button>
              ))}
        </div>
      </div>

      {/* Main Form & Output Grid */}
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form Column */}
          <div className="flex flex-col justify-between space-y-6">
            {mode === "normal" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                    Question / Problem
                  </label>
                  <textarea
                    rows={2}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter the question or problem statement..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3.5 text-sm font-medium text-[var(--color-text-h)] placeholder-[var(--color-text-light)] focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all resize-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="user-answer-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2"
                  >
                    Student Explanation / Response
                  </label>
                  <textarea
                    id="user-answer-input"
                    value={userAnswerText}
                    onChange={(e) => setUserAnswerText(e.target.value)}
                    rows={4}
                    placeholder="Enter student reasoning or explanation..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3.5 text-sm font-medium text-[var(--color-text-h)] placeholder-[var(--color-text-light)] focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="code-textarea"
                      className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]"
                    >
                      Submitted JavaScript Code
                    </label>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      solution.js
                    </span>
                  </div>
                  <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-navy)] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-2 text-xs font-mono text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
                      </div>
                      <span>JS Code Submission</span>
                    </div>
                    <textarea
                      id="code-textarea"
                      value={codeText}
                      onChange={(e) => setCodeText(e.target.value)}
                      rows={11}
                      className="w-full bg-transparent p-4 font-mono text-sm leading-relaxed text-emerald-400 focus:outline-none resize-none"
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleRunAnalysis}
                disabled={isLoading}
                size="md"
                className="flex-1"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing with Gemini AI...
                  </span>
                ) : (
                  "Run ConceptRoot AI Diagnostic"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                size="md"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Analysis Output Column (Rendering 8 Schema Fields) */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                ConceptRoot Diagnostic Output
              </h4>
              <span className="text-xs font-mono text-[var(--color-primary-600)]">
                {isLoading ? "Diagnosing with AI..." : "8-Field Schema"}
              </span>
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-primary-200)] bg-[var(--color-primary-50)]/30 p-8 text-center space-y-4">
                <div className="h-10 w-10 rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-h)]">
                    Analyzing student understanding with Gemini AI...
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Extracting correct reasoning, missing prerequisites, root breakdown, and personalized guidance.
                  </p>
                </div>
              </div>
            ) : hasAnalyzed && result ? (
              <div className="flex-1 flex flex-col justify-between space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
                {/* 1. Verdict & Status Header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Diagnostic Verdict:
                  </span>
                  {renderVerdictBadge(result.verdict)}
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  {/* 2. What You Got Right */}
                  {result.whatYouGotRight && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        ✓ What You Got Right
                      </span>
                      <p className="text-emerald-900 font-medium">
                        {result.whatYouGotRight}
                      </p>
                    </div>
                  )}

                  {/* 3. What Needs Attention */}
                  {result.whatNeedsAttention && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                        ⚠️ What Needs Attention
                      </span>
                      <p className="text-amber-900 font-medium">
                        {result.whatNeedsAttention}
                      </p>
                    </div>
                  )}

                  {/* 4. Focus First */}
                  {result.focusFirst && (
                    <div className="rounded-xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-700)] block mb-0.5">
                        🎯 Focus First (Highest Priority Concept)
                      </span>
                      <p className="text-sm font-bold text-[var(--color-primary-900)]">
                        {result.focusFirst}
                      </p>
                    </div>
                  )}

                  {/* 5. Why You're Getting Stuck */}
                  {result.whyYoureGettingStuck && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        Why You're Getting Stuck
                      </span>
                      <p className="text-[var(--color-text-body)] bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                        {result.whyYoureGettingStuck}
                      </p>
                    </div>
                  )}

                  {/* 6. Personalized Explanation */}
                  {result.personalizedExplanation && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        Personalized Explanation (Tailored to your submission)
                      </span>
                      <p className="text-[var(--color-text-body)] leading-relaxed">
                        {result.personalizedExplanation}
                      </p>
                    </div>
                  )}

                  {/* 7. Optional Next Step */}
                  {result.optionalNextStep && (
                    <div className="border-t border-[var(--color-border)] pt-3 flex items-start gap-2">
                      <span className="shrink-0 font-bold text-[var(--color-primary-600)]">
                        👉 Actionable Next Step:
                      </span>
                      <span className="text-[var(--color-text-h)] font-medium">
                        {result.optionalNextStep}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                Select an example scenario or type custom text above and click "Run ConceptRoot AI Diagnostic".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
