import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Section from "../components/Section";
import SectionHeading from "../components/SectionHeading";
import CtaBanner from "../components/CtaBanner";
import HeroSection from "../components/HeroSection";

/* =========================================================
   REUSABLE SVG ICONS
========================================================= */
function SparklesIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
   STATIC CONFIG & DATA
========================================================= */
const DOMAINS = [
  { id: "technology", label: "Technology", icon: "⌘", examples: "Programming, AI, Web Dev", sampleQuestion: "Explain how a REST API differs from GraphQL.", sampleAnswer: "REST APIs use standard HTTP verbs (GET, POST, PUT, DELETE) with fixed endpoints returning predefined data structures. GraphQL uses a single endpoint where clients specify exact query fields needed, avoiding over-fetching or under-fetching." },
  { id: "mathematics", label: "Mathematics", icon: "∑", examples: "Algebra, Calculus, Stats", sampleQuestion: "Explain the intuition behind the Central Limit Theorem.", sampleAnswer: "The Central Limit Theorem states that as sample size increases, the distribution of sample means approaches a normal distribution, regardless of the population's original shape, provided samples are independent." },
  { id: "science", label: "Science", icon: "⚛", examples: "Physics, Chemistry, Bio", sampleQuestion: "How do enzymes lower activation energy in chemical reactions?", sampleAnswer: "Enzymes act as biological catalysts by binding substrates at active sites. They stabilize transition states, align reactants, and weaken chemical bonds, thereby lowering the required activation energy." },
  { id: "business", label: "Business", icon: "◫", examples: "Strategy, Management, Marketing", sampleQuestion: "What is the difference between cost leadership and differentiation?", sampleAnswer: "Cost leadership focuses on achieving lower operational costs to offer competitive low prices. Differentiation focuses on creating unique product features or brand value that command premium prices." },
  { id: "finance", label: "Finance", icon: "₹", examples: "Investing, Accounting, Econ", sampleQuestion: "Explain why raising interest rates helps control inflation.", sampleAnswer: "Raising interest rates increases borrowing costs for consumers and businesses. This reduces spending and investments, slowing aggregate demand and cooling price inflation across the economy." },
  { id: "communication", label: "Communication", icon: "Aa", examples: "Writing, Speaking, Pitching", sampleQuestion: "How do you structure an executive elevator pitch?", sampleAnswer: "Start with the core problem statement, follow with your concise solution, highlight unique value proposition with key metrics, and close with a clear call to action." },
  { id: "design", label: "Design", icon: "◇", examples: "UI/UX, Visual, Research", sampleQuestion: "Explain visual hierarchy in user interface design.", sampleAnswer: "Visual hierarchy guides user focus through contrast, typography scale, spacing, color highlights, and alignment to ensure key actions are clear and intuitive." },
  { id: "other", label: "Other", icon: "＋", examples: "General Professional Skills", sampleQuestion: "How do you prioritize competing project deadlines?", sampleAnswer: "I use an Eisenhower Matrix framework evaluating urgency and impact, communicate with stakeholders to align expectations, and break tasks into milestone deliverables." },
];

const GOALS = [
  { id: "software", title: "Software Engineer", category: "Technology", requiredSkills: ["Problem Solving", "Programming", "Data Structures", "System Design"] },
  { id: "data", title: "Data Scientist", category: "Technology", requiredSkills: ["Statistics", "Python", "Data Analysis", "Machine Learning"] },
  { id: "manager", title: "Business Manager", category: "Business", requiredSkills: ["Decision Making", "Communication", "Leadership", "Business Strategy"] },
  { id: "finance", title: "Financial Analyst", category: "Finance", requiredSkills: ["Financial Analysis", "Statistics", "Decision Making", "Communication"] },
  { id: "designer", title: "UI/UX Designer", category: "Design", requiredSkills: ["Visual Design", "User Research", "Problem Solving", "Communication"] },
  { id: "research", title: "Researcher", category: "Science", requiredSkills: ["Critical Thinking", "Research", "Analysis", "Communication"] },
];

const HERO_STEPS = [
  ["01", "Demonstrate", "Answer a question or explain a concept"],
  ["02", "Evaluate", "AI analyzes reasoning and depth"],
  ["03", "Map Gap", "Get custom career skill gap analysis"],
];

/* Same key OnboardingPage.jsx writes to. Kept in sync so this page
   can silently pre-fill domain/goal from what the user already told
   us during onboarding, instead of asking again. */
const ONBOARDING_STORAGE_KEY = "aifinity_onboarding_profile";

/* =========================================================
   SUB-COMPONENTS (theme tokens instead of hardcoded colors)
========================================================= */
function ScoreRing({ score }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-surface-secondary)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="var(--color-primary-600)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>{score}</span>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-light)" }}>/ 100</span>
      </div>
    </div>
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

function GapBar({ current, target }) {
  return (
    <div className="space-y-2">
      <div className="relative h-3 overflow-hidden rounded-full" style={{ background: "var(--color-surface-secondary)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: `${current}%`, background: "var(--color-primary-600)" }} />
        <div className="absolute inset-y-0 w-1.5 rounded-full shadow-sm" style={{ left: `${target}%`, background: "var(--color-accent)" }} />
      </div>

      <div className="flex justify-between text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
        <span>Current: {current}%</span>
        <span className="font-bold" style={{ color: "var(--color-primary-600)" }}>Target: {target}%</span>
      </div>
    </div>
  );
}

/* Interactive selection tiles — kept custom (not the shared Card).
   They need active/selected state styling and button semantics that
   Card doesn't model, unlike the passive info cards elsewhere on
   this page. */
function DomainTile({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      className="group rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
      style={
        active
          ? { borderColor: "var(--color-primary-600)", background: "var(--color-primary-50)", boxShadow: "var(--shadow-card-hover)" }
          : { borderColor: "var(--color-border)", background: "var(--color-surface)" }
      }
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold transition-all duration-300"
        style={active ? { background: "var(--color-primary-600)", color: "#fff" } : { background: "var(--color-surface-secondary)", color: "var(--color-primary-600)" }}
      >
        {item.icon}
      </div>
      <h4 className="mt-3 text-sm font-bold" style={{ color: "var(--color-text-h)" }}>{item.label}</h4>
      <p className="mt-0.5 text-xs truncate" style={{ color: "var(--color-text-light)" }}>{item.examples}</p>
    </button>
  );
}

function GoalCard({ item, active, isRecommended, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.title)}
      className="group flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
      style={
        active
          ? { borderColor: "var(--color-primary-600)", background: "var(--color-primary-50)", boxShadow: "var(--shadow-card-hover)" }
          : { borderColor: "var(--color-border)", background: "var(--color-surface)" }
      }
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-light)" }}>{item.category}</span>
          {isRecommended && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}>
              Recommended
            </span>
          )}
        </div>
        <h4 className="mt-1 font-bold text-sm" style={{ color: "var(--color-text-h)" }}>{item.title}</h4>
      </div>

      <div
        className="flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-all duration-300"
        style={active ? { borderColor: "var(--color-primary-600)", background: "var(--color-primary-600)", color: "#fff" } : { borderColor: "var(--color-border)", color: "var(--color-text-light)" }}
      >
        {active ? <CheckIcon className="w-3.5 h-3.5" /> : <ArrowRightIcon className="w-3.5 h-3.5" />}
      </div>
    </button>
  );
}

import { skillGapApi } from "../services/api";

/* =========================================================
   MAIN SKILL GAP COMPONENT
========================================================= */
export default function SkillGap() {
  const [domain, setDomain] = useState("technology");
  const [goal, setGoal] = useState("Software Engineer");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [activeGap, setActiveGap] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prefilledFromOnboarding, setPrefilledFromOnboarding] = useState(false);
  const canAnalyze = question.trim().length >= 8 && answer.trim().length >= 10;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    skillGapApi
      .get()
      .then((res) => {
        if (res && res.success && res.data) {
          const sourceSkills = Array.isArray(res.data.skills) ? res.data.skills : [];
          const mappedAnalysis = {
            score: res.data.overallProficiency ?? 0,
            averageGap: res.data.averageGap ?? 0,
            strengths: res.data.strongAreas?.map((item) => item.skillName) || [],
            goal: res.data.targetCareer || goal,
            recommendations: res.data.recommendations || [],
            gaps: sourceSkills.map((skill) => ({
              id: skill.skillId || skill.skillName,
              name: skill.skillName,
              current: skill.currentProficiency,
              target: skill.requiredProficiency,
              required: skill.requiredProficiency,
              gap: skill.gap,
              priority: (skill.priority || "medium").toLowerCase() === "high" ? "High" : "Medium",
              description: skill.aiExplanation || "Evidence-based skill review.",
              recommendation: (skill.recommendations && skill.recommendations[0]) || "Continue practicing the weaker concept clusters.",
            })),
            hasData: res.data.hasData,
          };
          setAnalysis(mappedAnalysis);
        }
      })
      .catch(() => {
        setAnalysis(null);
      });
  }, [goal]);

  // On first load, silently pick up whatever the user already told us
  // during onboarding (field + career goal) so they don't have to
  // repeat that selection here — they can still change it below.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;

      const profile = JSON.parse(raw);
      if (!profile) return;

      let matchedDomain = null;
      if (profile.field) {
        matchedDomain = DOMAINS.find(
          (d) => d.label.toLowerCase() === String(profile.field).toLowerCase()
        );
        if (matchedDomain) setDomain(matchedDomain.id);
      }

      if (profile.careerGoal) {
        const matchedGoal = GOALS.find(
          (g) => g.title.toLowerCase() === String(profile.careerGoal).toLowerCase()
        );
        if (matchedGoal) {
          setGoal(matchedGoal.title);
        } else if (matchedDomain) {
          // Career goal from onboarding doesn't map to a known GOALS
          // entry (e.g. a field-specific option not modeled here) —
          // fall back to the first goal matching the matched domain.
          const fallbackGoal = GOALS.find(
            (g) => g.category.toLowerCase() === matchedDomain.label.toLowerCase()
          );
          if (fallbackGoal) setGoal(fallbackGoal.title);
        }
      }

      if (matchedDomain || profile.careerGoal) {
        setPrefilledFromOnboarding(true);
      }
    } catch {
      // Missing/invalid onboarding data — safe to ignore, page just
      // keeps its own defaults.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGoal = useMemo(() => GOALS.find((item) => item.title === goal) || GOALS[0], [goal]);
  const selectedDomain = useMemo(() => DOMAINS.find((item) => item.id === domain) || DOMAINS[0], [domain]);

  const domainFilteredGoals = useMemo(() => {
    const matched = GOALS.filter((g) => g.category.toLowerCase() === selectedDomain.label.toLowerCase());
    return matched.length > 0 ? matched : GOALS;
  }, [selectedDomain]);

  const handleDomainChange = (id) => {
    setDomain(id);
    setAnalysis(null);
    setPrefilledFromOnboarding(false);
    const targetDomainObj = DOMAINS.find((d) => d.id === id);
    if (targetDomainObj) {
      const matchedGoal = GOALS.find((g) => g.category.toLowerCase() === targetDomainObj.label.toLowerCase());
      if (matchedGoal) setGoal(matchedGoal.title);
    }
  };

  const handleGoalChange = (value) => {
    setGoal(value);
    setAnalysis(null);
    setPrefilledFromOnboarding(false);
  };

  const resetAssessment = () => {
    setAnalysis(null);
    setQuestion("");
    setAnswer("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredGaps = useMemo(() => {
    if (!analysis || !analysis.gaps) return [];
    if (priorityFilter === "All") return analysis.gaps;
    return analysis.gaps.filter((g) => g.priority === priorityFilter);
  }, [analysis, priorityFilter]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* =========================================================
         HERO SECTION
      ========================================================= */}
      <HeroSection
        variant="skill-gap"
        eyebrow="AIFinity AI · Skill Gap Analysis"
        title="Know exactly where you"
        highlightWord="stand — and what's next."
        description="Discover your exact proficiency level in any skill with AI-powered analysis. Get personalized insights into your strengths and the gaps you need to close for your target career role."
        primaryCta={{ label: "Start Assessment", href: "#assessment" }}
        secondaryCta={{ label: "See How It Works", href: "#how-it-works" }}
      />

      {/* INTRO SECTION — explains what this page is and why it matters */}
      <Section id="how-it-works" className="pt-0 sm:pt-0">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary-600)" }}>
            What is Skill Gap Analysis?
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
            Most people guess what they need to learn. AIFinity AI measures it.
          </h2>
          <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-muted)" }}>
            Pick your field and target career role, then explain a real concept in your own words. Instead of a
            generic quiz, AIFinity AI reads your reasoning — not just the final answer — to figure out how close you
            actually are to your target role, and shows you the specific gaps to close next.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
          {HERO_STEPS.map(([number, title, description]) => (
            <Card
              key={number}
              icon={<span style={{ fontFamily: "var(--font-mono)" }} className="text-lg font-bold">{number}</span>}
              title={title}
            >
              {description}
            </Card>
          ))}
        </div>
      </Section>

      {/* ASSESSMENT SECTION */}
      <Section id="assessment">
        <SectionHeading
          eyebrow="STEP-BY-STEP ASSESSMENT"
          title="Start with what you actually know"
          subtitle="Select a domain, target goal, and answer a question. AIFinity uses empirical evidence to measure capability."
        />

        {prefilledFromOnboarding && (
          <div
            className="mb-8 flex items-center gap-3 rounded-xl border p-4"
            style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)" }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--color-surface)", color: "var(--color-primary-600)" }}>
              <SparklesIcon className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              We've pre-filled your domain and career goal from onboarding. Feel free to change them below.
            </p>
          </div>
        )}

        {/* Step 1: Select Domain */}
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary-600)" }}>Step 01</span>
              <h3 className="mt-0.5 text-lg font-bold" style={{ color: "var(--color-text-h)" }}>What field are you learning?</h3>
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--color-text-light)" }}>8 Supported Domains</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DOMAINS.map((item) => (
              <DomainTile key={item.id} item={item} active={domain === item.id} onClick={handleDomainChange} />
            ))}
          </div>
        </div>

        {/* Step 2: Select Goal */}
        <div className="mb-12">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary-600)" }}>Step 02</span>
            <h3 className="mt-0.5 text-lg font-bold" style={{ color: "var(--color-text-h)" }}>What is your target career role?</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {domainFilteredGoals.map((item) => {
              const active = goal === item.title;
              const isRecommended = item.category.toLowerCase() === selectedDomain.label.toLowerCase();
              return (
                <GoalCard key={item.id} item={item} active={active} isRecommended={isRecommended} onClick={handleGoalChange} />
              );
            })}
          </div>
        </div>

        {/* Step 3: Question & Answer Submission Card */}
        <Card hoverable={false} className="p-6 shadow-sm sm:p-8 transition-all duration-300 hover:shadow-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary-600)" }}>Step 03</span>
              <h3 className="mt-0.5 text-xl font-bold" style={{ color: "var(--color-text-h)" }}>Show us your knowledge</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Ask a question and explain your answer. Or click the preset button below to test instantly.
              </p>
            </div>

            <Button
              size="sm"
              variant="subtle"
              onClick={() => setAnalysis(null)}
              icon={<SparklesIcon className="w-4 h-4" style={{ color: "var(--color-primary-600)" }} />}
              iconPosition="left"
            >
              Refresh skill data
            </Button>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="question" className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text-h)" }}>
                The Question or Problem
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder={`e.g. ${selectedDomain.sampleQuestion}`}
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-4"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-h)" }}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="answer" className="block text-sm font-semibold" style={{ color: "var(--color-text-h)" }}>
                  Your Reasoning & Explanation
                </label>
                <span className="text-xs font-medium" style={{ color: "var(--color-text-light)" }}>{wordCount} words</span>
              </div>

              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                placeholder="Explain your thought process. AIFinity evaluates logic, concepts, and depth..."
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition-all duration-200 focus:ring-4"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-h)" }}
              />
            </div>

            <div
              className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-xs" style={{ background: "var(--color-surface)", color: "var(--color-primary-600)" }}>
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--color-text-h)" }}>AI Evaluation Criteria</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Decomposition · Logic · Concepts · Application</p>
                </div>
              </div>

              <Button
                size="lg"
                disabled
                icon={<SpinnerIcon />}
                className="w-full sm:w-auto opacity-60 cursor-not-allowed"
              >
                Uses assessment history
              </Button>
            </div>
          </div>
        </Card>
      </Section>

      {/* AI ANALYSIS RESULTS SECTION */}
      {analysis && (
        <Section id="analysis-result" className="scroll-mt-20">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                AI Skill Analysis Complete
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
                Here's what we discovered
              </h2>

              <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--color-text-muted)" }}>
                Analysis based on response in <strong style={{ color: "var(--color-text-h)" }}>{selectedDomain.label}</strong> evaluated against target role <strong style={{ color: "var(--color-primary-600)" }}>{analysis.goal}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={resetAssessment}
              className="text-sm font-semibold transition"
              style={{ color: "var(--color-primary-600)" }}
            >
              ← Analyze another question
            </button>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card hoverable={false} className="p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <ScoreRing score={analysis.score} />

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>
                    Demonstrated Capability
                  </span>

                  <h3 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>
                    {analysis.score >= 75 ? "Strong Capability Foundation" : analysis.score >= 60 ? "Developing Capability" : "Early Stage Capability"}
                  </h3>

                  <p className="mt-2 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                    Reflects how effectively your reasoning demonstrated underlying concepts and application.
                  </p>
                </div>
              </div>
            </Card>

            <Card hoverable={false} className="p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-600)" }}>
                Estimated Career Gap
              </span>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-h)" }}>{analysis.averageGap}</span>
                <span className="mb-1 text-xs font-medium" style={{ color: "var(--color-text-light)" }}>points average skill gap</span>
              </div>

              <div className="mt-4">
                <ProgressBar value={Math.min(analysis.averageGap * 2.5, 100)} />
              </div>

              <p className="mt-3 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
                The smaller this gap number, the closer your demonstrated abilities match your target role.
              </p>
            </Card>
          </div>

          {/* Strengths List */}
          <div className="mt-6">
            <Card hoverable={false} className="p-5 shadow-sm transition-all duration-300 hover:shadow-lg" style={{ borderColor: "var(--color-primary-100)" }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-600)" }}>
                  <CheckIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold" style={{ color: "var(--color-text-h)" }}>Demonstrated Strengths</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {analysis.strengths.map((str) => (
                      <span
                        key={str}
                        className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                        style={{ borderColor: "var(--color-primary-100)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}
                      >
                        ✓ {str}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Gaps List & Priority Filter */}
          <div className="mt-10">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold" style={{ color: "var(--color-text-h)" }}>Identified Skill Gaps</h3>
                <p className="text-xs" style={{ color: "var(--color-text-light)" }}>Focus on these areas to reach target proficiency.</p>
              </div>

              <div className="flex gap-1.5">
                {["All", "High", "Medium"].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setPriorityFilter(priority)}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 active:scale-95"
                    style={
                      priorityFilter === priority
                        ? { background: "var(--color-primary-600)", color: "#fff" }
                        : { border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }
                    }
                  >
                    {priority} Priority
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {filteredGaps.map((gap, index) => {
                const expanded = activeGap === index;
                return (
                  <button key={gap.name} type="button" onClick={() => setActiveGap(expanded ? null : index)} className="text-left">
                    <Card
                      hoverable
                      className="h-full"
                      style={expanded ? { boxShadow: "var(--shadow-card-hover)", borderColor: "var(--color-primary-600)" } : undefined}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "var(--color-primary-50)", color: "var(--color-primary-700)" }}>
                          0{index + 1}
                        </span>
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={
                            gap.priority === "High"
                              ? { borderColor: "var(--color-primary-200)", background: "var(--color-primary-50)", color: "var(--color-primary-700)" }
                              : { borderColor: "var(--color-border)", background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" }
                          }
                        >
                          {gap.priority}
                        </span>
                      </div>

                      <h4 className="mt-3 font-bold text-base" style={{ color: "var(--color-text-h)" }}>{gap.name}</h4>
                      <p className="mt-1 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>{gap.description}</p>

                      <div className="mt-4">
                        <GapBar current={gap.current} target={gap.target} />
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                        <span className="text-xs font-semibold" style={{ color: "var(--color-primary-600)" }}>
                          {expanded ? "Hide details" : "View recommendations"}
                        </span>
                        <ArrowRightIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} style={{ color: "var(--color-primary-600)" }} />
                      </div>

                      {expanded && (
                        <div className="mt-3 rounded-lg p-3 text-xs leading-5" style={{ background: "var(--color-surface-secondary)", color: "var(--color-text-muted)" }}>
                          <strong style={{ color: "var(--color-text-h)" }}>Action Plan:</strong> Solve targeted practical problems covering {gap.name.toLowerCase()} concepts.
                        </div>
                      )}
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* FINAL CTA BANNER */}
      <Section>
        <CtaBanner
          eyebrow="EVIDENCE-BASED LEARNING"
          title="Turn your skill gaps into personalized roadmaps."
          buttonLabel="View Personalized Roadmap"
          href="/roadmap"
        />
      </Section>
    </div>
  );
}
