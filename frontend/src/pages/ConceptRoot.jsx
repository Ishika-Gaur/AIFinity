import React, { useRef, useState, useEffect } from "react";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import Card from "../components/Card";
import ConceptRootDemo from "../components/ConceptRootDemo";
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";
import { conceptRootApi } from "../services/api";
import { useStudentAuth } from "../context/StudentAuthContext";
import { Link } from "react-router-dom";

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Student Submission",
    description: "Submit a normal quiz answer, conceptual response, or JavaScript code snippet.",
  },
  {
    step: "02",
    title: "Analyze the Mistake",
    description: "ConceptRoot evaluates the submission mechanics beyond simple right/wrong checks.",
  },
  {
    step: "03",
    title: "Find the Root Cause",
    description: "Identify the exact underlying concept and missing prerequisite knowledge gap.",
  },
  {
    step: "04",
    title: "Personalized Guidance",
    description: "Receive targeted study topics and practice recommendations customized to your gap.",
  },
];

const FEATURE_CARDS = [
  {
    eyebrow: "DIAGNOSTIC 01",
    title: "Root Cause Analysis",
    description:
      "Pinpoint the exact foundational concept that caused the mistake, rather than relying on rote answer memorization.",
  },
  {
    eyebrow: "DIAGNOSTIC 02",
    title: "Concept Gap Detection",
    description:
      "Identify missing prerequisite knowledge from earlier topics that is blocking progress on current material.",
  },
  {
    eyebrow: "DIAGNOSTIC 03",
    title: "Adaptive Learning Path",
    description:
      "Get targeted concepts and tailored practice exercises directly addressing the detected gap.",
  },
];

const JOURNEY_STEPS = [
  "Student Submission",
  "Mistake Detected",
  "Root Concept",
  "Missing Prerequisite",
  "Recommended Concept",
  "Practice",
  "Improved Understanding",
];

export default function ConceptRoot() {
  const demoRef = useRef(null);
  const howItWorksRef = useRef(null);

  const { user } = useStudentAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      const res = await conceptRootApi.get();
      if (res.success) {
        setData(res.data);
      } else {
        setError(true);
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  const handleScrollToDemo = (e) => {
    if (e) e.preventDefault();
    if (demoRef.current) {
      const navbarHeight = 85;
      const elementPosition = demoRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleScrollToHowItWorks = (e) => {
    if (e) e.preventDefault();
    if (howItWorksRef.current) {
      const navbarHeight = 85;
      const elementPosition = howItWorksRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const hasData = data && data.learningDiagnosis && data.learningDiagnosis.hasDiagnosis;

  return (
    <div>
      {/* HERO SECTION */}
      <HeroSection
        variant="concept-root"
        eyebrow="AI-Powered · ConceptRoot"
        title="Find the root,"
        highlightWord="not just the mistake"
        description="Wrong answers don't just get marked incorrect. Our AI traces each one back to the underlying concept gap, so you always know exactly what to fix."
        primaryCta={{ label: "See Your ConceptRoot", href: "#your-personalized-conceptroot" }}
        secondaryCta={{ label: "How It Works", href: "#how-it-works" }}
      />

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Traditional Feedback Card — kept bespoke: this is a one-off
              comparison layout, not a repeatable list item, so the
              generic Card shape doesn't fit it. */}
          <div className="rounded-2xl border border-red-100 bg-red-50/30 p-8 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-2">
                Traditional Feedback
              </span>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Surface-Level Checking
              </h3>
              <div className="space-y-4 text-sm font-medium">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-red-100 text-red-600">
                  <span className="text-lg">❌</span>
                  <span>Incorrect Answer</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 text-gray-700">
                  <span className="text-lg">✓</span>
                  <span>Correct answer provided (Memorize it)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">
              Result: Student memorizes the correct answer without fixing the underlying concept gap.
            </p>
          </div>

          {/* ConceptRoot Card — same, bespoke flow layout */}
          <div className="rounded-2xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)]/40 p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div>
              <span className="text-xs font-bold text-[var(--color-primary-600)] uppercase tracking-wider block mb-2">
                ConceptRoot AI
              </span>
              <h3 className="text-xl font-bold text-[var(--color-text-h)] mb-6">
                Root Cause Diagnosis
              </h3>
              <div className="space-y-2.5 text-xs font-medium">
                <div className="p-2.5 bg-white rounded-lg border border-red-200 text-red-700 flex items-center justify-between">
                  <span>❌ Incorrect Attempt</span>
                </div>
                <div className="text-center text-[var(--color-primary-600)] font-bold text-xs">↓</div>
                <div className="p-2.5 bg-white rounded-lg border border-[var(--color-primary-200)] text-[var(--color-text-h)]">
                  🔍 Mistake Identified
                </div>
                <div className="text-center text-[var(--color-primary-600)] font-bold text-xs">↓</div>
                <div className="p-2.5 bg-white rounded-lg border border-[var(--color-primary-200)] text-[var(--color-primary-900)] font-semibold">
                  🧠 Root Concept Detected
                </div>
                <div className="text-center text-[var(--color-primary-600)] font-bold text-xs">↓</div>
                <div className="p-2.5 bg-white rounded-lg border border-indigo-200 text-indigo-900 font-semibold">
                  ⚠️ Missing Prerequisite Identified
                </div>
                <div className="text-center text-[var(--color-primary-600)] font-bold text-xs">↓</div>
                <div className="p-2.5 bg-[var(--color-primary-600)] text-white rounded-lg font-bold text-center">
                  🎯 Targeted Practice & Guidance
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <div ref={howItWorksRef} id="how-it-works" className="scroll-mt-20">
        <Section className="border-y border-[var(--color-border)]">
          <SectionHeading
            eyebrow="STEP-BY-STEP"
            title="How ConceptRoot Works"
            subtitle="Four simple steps from attempt to deep conceptual clarity."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <Card
                key={s.step}
                icon={<span style={{ fontFamily: "var(--font-mono)" }} className="text-lg font-bold">{s.step}</span>}
                title={s.title}
              >
                {s.description}
              </Card>
            ))}
          </div>
        </Section>
      </div>

      {/* INTERACTIVE DEMO */}
      <div ref={demoRef} id="interactive-demo" className="scroll-mt-20">
        <Section>
          <SectionHeading
            eyebrow="LIVE DEMO"
            title="Interactive ConceptRoot Demo"
            subtitle="Try out ConceptRoot on a sample conceptual question or JavaScript code snippet."
          />

          <ConceptRootDemo />
        </Section>
      </div>

      {/* WHAT CONCEPTROOT FINDS */}
      <Section className="border-y border-[var(--color-border)]">
        <SectionHeading
          eyebrow="DIAGNOSTICS"
          title="What ConceptRoot Finds"
          subtitle="Three core capabilities engineered to eliminate blind spots."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURE_CARDS.map((f) => (
            <Card key={f.eyebrow} eyebrow={f.eyebrow} title={f.title}>
              {f.description}
            </Card>
          ))}
        </div>
      </Section>

      {/* EXAMPLE LEARNING JOURNEY */}
      <Section>
        <SectionHeading
          eyebrow="VISUAL PROGRESSION"
          title="Example Learning Journey"
          subtitle="How ConceptRoot transforms an error into master-level understanding."
        />

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-center">
            {JOURNEY_STEPS.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex-1 min-w-[130px] p-3 rounded-xl bg-[var(--color-primary-50)] border border-[var(--color-primary-100)]">
                  <span className="text-[10px] font-mono font-bold text-[var(--color-primary-700)] block uppercase">
                    Step 0{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-h)]">
                    {step}
                  </span>
                </div>
                {idx < JOURNEY_STEPS.length - 1 && (
                  <span className="hidden lg:block text-xs font-bold text-[var(--color-primary-400)]">
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Section>

  {/* PERSONALIZED CONCEPTROOT SECTION */}
  <Section id="your-personalized-conceptroot" className="border-t border-[var(--color-border)] scroll-mt-20">
    <SectionHeading
      eyebrow="YOUR PERSONALIZED CONCEPTROOT"
      title="Based on Your Assessment Results"
      subtitle="Real analysis of your learning patterns and concept gaps."
    />

    {loading ? (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    ) : error ? (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load your ConceptRoot analysis</h3>
        <p className="text-gray-600 mb-6">There was a problem fetching your personalized data. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)] transition-colors"
        >
          Retry
        </button>
      </div>
    ) : !user ? (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-[var(--color-primary-600)] mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to see your personalized ConceptRoot analysis</h3>
        <p className="text-gray-600 mb-6">Log in to view your personalized learning diagnosis and recommendations.</p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)] transition-colors"
        >
          Sign In
        </Link>
      </div>
    ) : (!data || !data.hasData || !data.conceptId) ? (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-[var(--color-primary-600)] mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete an assessment to see your personalized ConceptRoot analysis</h3>
        <p className="text-gray-600 mb-6">We need more data! Take an assessment so we can detect any underlying concept gaps.</p>
        <Link
          to="/assessment"
          className="inline-block px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)] transition-colors"
        >
          Start Assessment
        </Link>
      </div>
    ) : (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Core Diagnosis Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-[var(--color-text-h)]">
                Root Cause Detected
              </h3>
              <p className="text-gray-600 mt-1">
                Based on <span className="font-semibold">{data.rootCause.evidenceCount}</span> pieces of primary evidence across {data.sourceAttemptCount} attempts.
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500 uppercase tracking-wide block mb-1">Confidence Score</span>
              <span className="text-3xl font-bold text-[var(--color-primary-600)]">
                {Math.round(data.rootCause.confidence * 100)}%
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center bg-[var(--color-primary-50)] p-4 rounded-xl border border-[var(--color-primary-100)]">
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Observed Weakness</span>
              <span className="text-lg font-bold text-red-600">{data.canonicalConcept}</span>
            </div>
            
            <div className="hidden md:flex flex-col items-center flex-1 px-4 text-[var(--color-primary-400)]">
              <span className="text-xs font-mono mb-1">TRACED TO</span>
              <span className="text-2xl">←</span>
            </div>

            <div className="flex-1 text-center md:text-right">
              <span className="text-xs text-[var(--color-primary-600)] uppercase font-bold block mb-1">Prerequisite Root Cause ({data.rootCause.type.replace(/_/g, ' ')})</span>
              <span className="text-lg font-bold text-[var(--color-primary-900)]">{data.rootCause.rootConceptName}</span>
            </div>
          </div>
        </div>

        {/* AI Explanations */}
        {data.explanation && data.aiStatus === "completed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Why is this happening?</h4>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{data.explanation.explanation}</p>
              
              {data.explanation.misconception && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <span className="text-xs font-bold text-red-600 uppercase mb-1 block">Likely Misconception</span>
                  <span className="text-sm text-gray-800">{data.explanation.misconception}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Recommended Plan</h4>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-[var(--color-primary-600)] uppercase mb-2 block">1. Revise First</span>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {data.explanation.recommendedRevision.map((rev, i) => <li key={i}>{rev}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-bold text-green-600 uppercase mb-2 block">2. Then Practice</span>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {data.explanation.recommendedPractice.map((prac, i) => <li key={i}>{prac}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Logs */}
        {data.evidence && data.evidence.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-[var(--color-text-h)] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Supporting Evidence
            </h4>
            <div className="space-y-3">
              {data.evidence.map((sq, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                  <div className="font-medium text-gray-900 mb-2">Question ID: {sq.questionId}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Your Answer:</span>
                      <span className="block mt-1 font-mono text-red-600">{sq.studentAnswer}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Correct Answer:</span>
                      <span className="block mt-1 font-mono text-green-600">{sq.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    )}
  </Section>

      {/* CTA */}
      <Section>
        <CtaBanner
          eyebrow="Ready to begin?"
          title="Your skill gap is waiting for you."
          buttonLabel="Start Free Assessment"
          href="/assessment"
        />
      </Section>
    </div>
  );
}
