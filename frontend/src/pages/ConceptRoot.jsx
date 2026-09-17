import React, { useRef, useState, useEffect } from "react";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import Card from "../components/Card";
import ConceptRootDemo from "../components/ConceptRootDemo";
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";
import { conceptRootApi, authApi } from "../services/api";
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

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    async function checkUser() {
      const res = await authApi.getMe();
      if (res && res.success && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem("user", JSON.stringify(res.user));
        } catch (_) {}
      }
    }
    checkUser();
  }, []);

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
      title="Root Cause Analysis Dashboard"
      subtitle="AI-driven deep diagnosis of your fundamental concept gaps."
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
    ) : !hasData ? (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-[var(--color-primary-600)] mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete an assessment to let ConceptRoot analyze your learning patterns.</h3>
        <p className="text-gray-600 mb-6">Take an assessment to unlock your personalized AI-driven root cause diagnosis.</p>
        <Link
          to="/assessment"
          className="inline-block px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)] transition-colors"
        >
          Take Assessment
        </Link>
      </div>
    ) : (
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* OVERALL CONCEPT HEALTH */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Overall Concept Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {data.learningDiagnosis.conceptHealth?.filter(c => !c.isRoot).map((concept, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-700">{concept.concept} (Surface)</span>
                  <span className={`font-bold ${concept.score >= 75 ? 'text-green-600' : concept.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{concept.score}%</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Root Concept Health</div>
              {data.learningDiagnosis.conceptHealth?.filter(c => c.isRoot).map((concept, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[var(--color-primary-50)] rounded-xl border border-[var(--color-primary-100)]">
                  <span className="font-medium text-[var(--color-primary-900)]">{concept.concept}</span>
                  <span className={`font-bold ${concept.score >= 75 ? 'text-green-600' : concept.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{concept.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROOT CAUSE ANALYSIS (VISUAL HIERARCHY) */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-primary-50)]/30 pointer-events-none"></div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-10">Root Cause Analysis</h3>
          
          <div className="space-y-8 relative z-10 w-full max-w-lg">
            {data.learningDiagnosis.dependencyPath?.map((step, idx, arr) => (
              <div key={idx} className="flex flex-col items-center group cursor-default">
                <div className={`px-6 py-4 rounded-2xl border-2 transition-all duration-300 transform group-hover:scale-105 ${
                  idx === arr.length - 1 
                    ? 'border-red-400 bg-red-50 shadow-md text-red-900' 
                    : 'border-[var(--color-primary-200)] bg-white shadow-sm text-[var(--color-text-h)]'
                }`}>
                  {idx === arr.length - 1 && <div className="text-xs font-bold text-red-600 mb-1">ROOT CAUSE 🔴</div>}
                  {idx === 0 && <div className="text-xs font-bold text-gray-400 mb-1">SURFACE PROBLEM</div>}
                  {idx !== 0 && idx !== arr.length - 1 && <div className="text-xs font-bold text-indigo-400 mb-1">PREREQUISITE</div>}
                  <div className="font-semibold text-lg">{step}</div>
                </div>
                
                {idx < arr.length - 1 && (
                  <div className="h-12 w-0.5 bg-gradient-to-b from-gray-300 to-gray-400 my-2 rounded relative group-hover:from-[var(--color-primary-400)] group-hover:to-red-400 transition-colors duration-300">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-gray-400 rotate-45 transform group-hover:bg-red-400 transition-colors duration-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI ROOT DIAGNOSIS CARD */}
        <div className="rounded-3xl border-2 border-[var(--color-primary-500)] bg-gradient-to-br from-[var(--color-primary-50)] to-white p-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <svg className="w-32 h-32 text-[var(--color-primary-600)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <span className="text-3xl">🤖</span>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">AI Root Diagnosis</h3>
          </div>
          
          <div className="relative z-10 space-y-6">
            <div>
              <div className="text-sm font-semibold text-[var(--color-primary-700)] uppercase tracking-wide">Primary Root Concept</div>
              <div className="flex items-end gap-4 mt-2">
                <div className="text-3xl font-black text-gray-900">{data.learningDiagnosis.primaryRootCause?.concept}</div>
                <div className="text-sm font-bold px-3 py-1 bg-green-100 text-green-800 rounded-full mb-1">
                  Confidence: {data.learningDiagnosis.primaryRootCause?.confidence}%
                </div>
              </div>
            </div>

            <div className="bg-white/60 p-6 rounded-2xl border border-white/40 shadow-sm backdrop-blur-sm">
              <div className="text-sm font-bold text-gray-700 mb-2">Explanation:</div>
              <p className="text-gray-800 text-lg leading-relaxed">
                "{data.learningDiagnosis.primaryRootCause?.explanation}"
              </p>
            </div>

            <div className="bg-white/60 p-6 rounded-2xl border border-white/40 shadow-sm backdrop-blur-sm">
              <div className="text-sm font-bold text-gray-700 mb-3">Why AI Thinks This:</div>
              <ul className="space-y-3">
                {data.learningDiagnosis.evidence?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-800">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {data.learningDiagnosis.secondaryRootCauses && data.learningDiagnosis.secondaryRootCauses.length > 0 && (
              <div className="pt-4 border-t border-[var(--color-primary-200)]">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Secondary Root Causes</div>
                <div className="flex flex-wrap gap-3">
                  {data.learningDiagnosis.secondaryRootCauses.map((cause, idx) => (
                    <div key={idx} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 flex items-center gap-2">
                      {cause.concept}
                      <span className="text-xs text-gray-500">{cause.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HOW YOUR MISTAKES CONNECT */}
        {data.learningDiagnosis.mistakePatterns && data.learningDiagnosis.mistakePatterns.length > 0 && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">How Your Mistakes Connect</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.learningDiagnosis.mistakePatterns.map((pattern, idx) => (
                <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col space-y-4">
                  <div>
                    <div className="text-xs font-bold text-red-500 uppercase">Mistake</div>
                    <div className="text-gray-900 font-medium mt-1">{pattern.mistake}</div>
                  </div>
                  <div className="text-center text-gray-400">↓</div>
                  <div>
                    <div className="text-xs font-bold text-orange-500 uppercase">Concept Problem</div>
                    <div className="text-gray-900 font-medium mt-1">{pattern.conceptProblem}</div>
                  </div>
                  <div className="text-center text-gray-400">↓</div>
                  <div>
                    <div className="text-xs font-bold text-[var(--color-primary-500)] uppercase">Fundamental Concept</div>
                    <div className="text-[var(--color-primary-900)] font-bold mt-1">{pattern.fundamentalConcept}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEARNING RECOVERY PATH */}
        {data.learningDiagnosis.recoveryPath && data.learningDiagnosis.recoveryPath.length > 0 && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-8">Your Concept Recovery Path</h3>
            <div className="space-y-4">
              {data.learningDiagnosis.recoveryPath.map((step, idx, arr) => (
                <div key={idx} className="relative flex gap-6 group cursor-pointer">
                  {/* Timeline line */}
                  {idx < arr.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200 group-hover:bg-[var(--color-primary-300)] transition-colors"></div>
                  )}
                  
                  {/* Circle */}
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center font-bold text-lg border-4 border-white shadow-sm z-10 shrink-0 group-hover:bg-[var(--color-primary-600)] group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group-hover:border-[var(--color-primary-200)] group-hover:shadow-md transition-all">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{step.step}</h4>
                      <p className="text-gray-600">{step.explanation}</p>
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
