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
    ) : !hasData ? (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-[var(--color-primary-600)] mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete an assessment to see your personalized ConceptRoot analysis</h3>
        <p className="text-gray-600 mb-6">Take an assessment to unlock your personalized learning diagnosis and recommendations.</p>
        <Link
          to="/assessment"
          className="inline-block px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)] transition-colors"
        >
          Start Assessment
        </Link>
      </div>
    ) : (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Performance Overview */}
        {data.performance && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Your Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[var(--color-primary-50)] rounded-xl">
                <div className="text-3xl font-bold text-[var(--color-primary-600)]">{data.performance.overallScore}%</div>
                <div className="text-sm text-gray-600 mt-1">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                <div className="text-3xl font-bold text-gray-900">{data.performance.totalAssessments}</div>
                <div className="text-sm text-gray-600 mt-1">Assessments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-600">{data.performance.strongConcepts}</div>
                <div className="text-sm text-gray-600 mt-1">Strong Concepts</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{data.performance.needsAttention}</div>
                <div className="text-sm text-gray-600 mt-1">Needs Attention</div>
              </div>
            </div>
          </div>
        )}

        {/* Concept Analysis */}
        {data.learningDiagnosis.concepts && data.learningDiagnosis.concepts.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Your Concept Analysis</h3>
            <div className="space-y-3">
              {data.learningDiagnosis.concepts.map((concept, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      concept.status === 'strong' ? 'bg-green-500' :
                      concept.status === 'improving' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-[var(--color-text-h)]">{concept.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{concept.attemptCount} attempts</span>
                    <span className={`font-semibold ${
                      concept.performance >= 75 ? 'text-green-600' :
                      concept.performance >= 55 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{concept.performance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mistakes */}
        {data.learningDiagnosis.mistakes && data.learningDiagnosis.mistakes.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Recent Mistakes</h3>
            <div className="space-y-3">
              {data.learningDiagnosis.mistakes.map((mistake, idx) => (
                <div key={idx} className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{mistake.assessmentTitle}</span>
                    <span className="text-red-600 font-semibold">{mistake.scorePercent}%</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {mistake.category} • {new Date(mistake.completedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Root Causes */}
        {data.learningDiagnosis.rootCauses && data.learningDiagnosis.rootCauses.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Root Cause Analysis</h3>
            <div className="space-y-4">
              {data.learningDiagnosis.rootCauses.map((cause, idx) => (
                <div key={idx} className="p-4 bg-[var(--color-primary-50)] rounded-xl border border-[var(--color-primary-200)]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">🧠</span>
                    <span className="font-semibold text-[var(--color-text-h)]">{cause.concept}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Current performance: {cause.currentPerformance}% • Gap to target: {cause.gap}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Prerequisites */}
        {data.learningDiagnosis.missingPrerequisites && data.learningDiagnosis.missingPrerequisites.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Missing Prerequisites</h3>
            <div className="space-y-3">
              {data.learningDiagnosis.missingPrerequisites.map((prereq, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${
                  prereq.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{prereq.concept}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      prereq.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {prereq.priority} priority
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{prereq.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.learningDiagnosis.recommendations && data.learningDiagnosis.recommendations.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text-h)] mb-4">Personalized Recommendations</h3>
            <div className="space-y-3">
              {data.learningDiagnosis.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-[var(--color-primary-50)] rounded-xl border border-[var(--color-primary-200)]">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--color-text-h)] mb-1">{rec.action}</div>
                      {rec.concept && (
                        <div className="text-sm text-gray-600">
                          {rec.type === 'concept_improvement' && `Current: ${rec.currentScore}% → Target: ${rec.targetScore}%`}
                          {rec.type === 'advance' && `Current: ${rec.currentScore}%`}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      rec.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {rec.priority}
                    </span>
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
