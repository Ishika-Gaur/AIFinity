import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Section from "../components/Section";
import Container from "../components/Container";
import SectionHeading from "../components/SectionHeading";
import Card from "../components/Card";
import Button from "../components/Button";
import ImageCard from "../components/ImageCard";
import { FIELDS, FIELD_ICONS, CAREER_GOALS_BY_FIELD } from "../utils/constants";
import { useStudentAuth } from "../context/StudentAuthContext";
import { isStudentUser } from "../utils/studentAuthStorage";
import { authApi } from "../services/api";
import CourseRequestModal from "../components/CourseRequestModal";

const WELCOME_ILLUSTRATION =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EEF2FF" />
      <stop offset="100%" stop-color="#E0E7FF" />
    </linearGradient>
  </defs>
  <rect width="400" height="250" fill="url(#bg)" />
  <g stroke="#A5B4FC" stroke-width="1.5" fill="none" opacity="0.9">
    <line x1="90" y1="80" x2="180" y2="60" />
    <line x1="180" y1="60" x2="280" y2="90" />
    <line x1="180" y1="60" x2="200" y2="150" />
    <line x1="90" y1="80" x2="200" y2="150" />
    <line x1="280" y1="90" x2="200" y2="150" />
    <line x1="200" y1="150" x2="130" y2="190" />
    <line x1="200" y1="150" x2="290" y2="180" />
  </g>
  <circle cx="90" cy="80" r="7" fill="#818CF8" />
  <circle cx="180" cy="60" r="9" fill="#4F46E5" />
  <circle cx="280" cy="90" r="7" fill="#818CF8" />
  <circle cx="200" cy="150" r="11" fill="#06B6D4" />
  <circle cx="130" cy="190" r="6" fill="#A5B4FC" />
  <circle cx="290" cy="180" r="6" fill="#A5B4FC" />
</svg>
`);

const LEVEL_OPTIONS = [
  { title: "Beginner", description: "Starting from the basics" },
  { title: "Intermediate", description: "Comfortable with the fundamentals" },
  { title: "Advanced", description: "Ready to go deeper" },
];

const TOTAL_STEPS = 4;
const ONBOARDING_STORAGE_KEY = "aifinity_onboarding_profile";

function getCareerGoalPlaceholder(currentField) {
  if (!currentField) return "e.g. Full Stack Developer, Software Engineer, Tech Lead...";
  const f = currentField.trim();

  // 1. If it's a predefined course field, use its actual career goals
  if (CAREER_GOALS_BY_FIELD[f] && CAREER_GOALS_BY_FIELD[f].length > 0) {
    const topGoals = CAREER_GOALS_BY_FIELD[f].slice(0, 3).join(", ");
    return `e.g. ${topGoals}...`;
  }

  // 2. Dynamic matching for custom courses
  const lower = f.toLowerCase();

  if (lower.includes("python") && (lower.includes("stack") || lower.includes("full"))) {
    return "e.g. Python Full Stack Developer, Backend Engineer, Tech Lead...";
  }
  if (lower.includes("python")) {
    return "e.g. Python Developer, Backend Engineer, Data Analyst...";
  }
  if (lower.includes("mern") || lower.includes("mean") || lower.includes("full stack")) {
    return `e.g. ${f} Developer, Software Engineer, Tech Lead...`;
  }
  if (lower.includes("react") || lower.includes("frontend") || lower.includes("angular") || lower.includes("vue") || lower.includes("web")) {
    return "e.g. Frontend Engineer, Full Stack Developer, Web Architect...";
  }
  if (lower.includes("android") || lower.includes("ios") || lower.includes("flutter") || lower.includes("mobile") || lower.includes("react native")) {
    return "e.g. Mobile App Developer, iOS/Android Engineer, App Architect...";
  }
  if (lower.includes("cloud") || lower.includes("devops") || lower.includes("aws") || lower.includes("azure") || lower.includes("kubernetes")) {
    return "e.g. DevOps Engineer, Cloud Architect, Site Reliability Engineer...";
  }
  if (lower.includes("data") || lower.includes("analytics") || lower.includes("bi") || lower.includes("sql")) {
    return "e.g. Data Scientist, Data Analyst, Data Engineer...";
  }
  if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("deep learning") || lower.includes("nlp")) {
    return "e.g. AI Engineer, Machine Learning Specialist, AI Researcher...";
  }
  if (lower.includes("cyber") || lower.includes("security") || lower.includes("hacker") || lower.includes("soc")) {
    return "e.g. Security Analyst, Penetration Tester, Cybersecurity Consultant...";
  }
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("figma")) {
    return "e.g. UI/UX Designer, Product Designer, Creative Director...";
  }
  if (lower.includes("developer") || lower.includes("engineer")) {
    return `e.g. Junior ${f}, Senior ${f}, Tech Lead...`;
  }

  return `e.g. ${f} Engineer, ${f} Specialist, Consultant...`;
}

function getRelatedFields(searchTerm) {
  if (!searchTerm) return [];
  const term = searchTerm.toLowerCase();
  const related = [];

  const mappings = [
    { keywords: ["python", "java", "c++", "c#", "full stack", "backend", "software", "programmer", "coding", "algorithm", "developer"], field: "Software Development" },
    { keywords: ["web", "html", "css", "javascript", "react", "node", "mern", "frontend", "php", "full stack", "vue", "angular"], field: "Web Development" },
    { keywords: ["data", "analytics", "sql", "excel", "tableau", "power bi", "statistic", "analyst"], field: "Data Science & Analytics" },
    { keywords: ["ai", "machine learning", "ml", "deep learning", "nlp", "llm", "neural", "vision"], field: "AI & Machine Learning" },
    { keywords: ["android", "ios", "flutter", "react native", "swift", "kotlin", "app", "mobile"], field: "Mobile App Development" },
    { keywords: ["cloud", "devops", "aws", "azure", "docker", "kubernetes", "linux", "gcp"], field: "Cloud Computing & DevOps" },
    { keywords: ["cyber", "security", "ethical hacking", "network", "infosec", "penetration", "soc"], field: "Cybersecurity" },
    { keywords: ["ui", "ux", "design", "graphic", "figma", "photoshop", "illustrator"], field: "Graphic Design & UI/UX" },
    { keywords: ["marketing", "seo", "social media", "ads", "digital", "content"], field: "Digital Marketing" },
    { keywords: ["finance", "accounting", "banking", "stock", "tax", "audit", "crypto"], field: "Finance & Accounting" },
    { keywords: ["business", "management", "mba", "product manager", "startup", "operations"], field: "Business & Management" },
  ];

  for (const item of mappings) {
    if (item.keywords.some((k) => term.includes(k))) {
      if (!related.includes(item.field)) {
        related.push(item.field);
      }
    }
  }

  return related.slice(0, 3);
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, applySession } = useStudentAuth();
  const [step, setStep] = useState(1);
  const [field, setField] = useState(null);
  const [level, setLevel] = useState(null);
  const [careerGoal, setCareerGoal] = useState(null);
  const [isFieldLocked, setIsFieldLocked] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [customField, setCustomField] = useState("");
  const [customCareerGoal, setCustomCareerGoal] = useState("");

  const [loadingCheck, setLoadingCheck] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Course Request modal state
  const [isCourseRequestModalOpen, setIsCourseRequestModalOpen] = useState(false);
  const [requestCoursePrefill, setRequestCoursePrefill] = useState("");

  // Resume from the authenticated student session (guard already verified /auth/me).
  useEffect(() => {
    if (!user) return;

    if (user.onboardingCompleted) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const savedField = user.selectedField || user.onboardingProfile?.field;
    if (savedField) {
      setField(savedField);
      setIsFieldLocked(true);
      setStep(3);
    }

    setLoadingCheck(false);
  }, [user, navigate]);

  // Keep career goals synced with selected field
  useEffect(() => {
    if (careerGoal && field && CAREER_GOALS_BY_FIELD[field] && !CAREER_GOALS_BY_FIELD[field]?.includes(careerGoal)) {
      // Only reset if there ARE predefined goals for this field and current goal isn't in them
      // For custom fields, don't reset
      if (!customCareerGoal) {
        setCareerGoal(null);
      }
    }
  }, [field, careerGoal, customCareerGoal]);

  // Filtered fields based on search
  const filteredFields = fieldSearch
    ? FIELDS.filter(f => f.toLowerCase().includes(fieldSearch.toLowerCase()))
    : FIELDS;

  // Scroll to top on step changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [step]);

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => {
    // If field is locked, user cannot go back past step 3 to change field
    if (isFieldLocked && step === 3) {
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  // Requirement 5: Final button action "Start Learning"
  const handleStartLearning = async () => {
    if (saving) return;
    setError("");

    const spamWords = ["hi", "hii", "hello", "test", "testing", "asdf", "qwerty", "1234"];

    if (!field || !FIELDS.includes(field)) {
      setError("Please select a recognized course from our verified curriculum.");
      setStep(2);
      return;
    }

    if (!careerGoal || careerGoal.trim().length < 3 || spamWords.includes(careerGoal.trim().toLowerCase())) {
      setError("Please select or enter a valid career goal.");
      setStep(4);
      return;
    }

    setSaving(true);

    const payload = {
      field,
      careerGoal: careerGoal || field || "",
      level: level || "Intermediate",
    };

    // 1. Save onboarding completion & selected field to persistent backend DB
    const res = await authApi.completeOnboarding(payload);

    let updatedUser = null;
    if (res && res.success && isStudentUser(res.user)) {
      updatedUser = res.user;
    } else {
      updatedUser = {
        ...(user || {}),
        role: "student",
        onboardingCompleted: true,
        selectedField: field,
        onboardingProfile: payload,
      };
    }

    applySession(updatedUser);
    try {
      window.localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch (_) {}

    setSaving(false);

    // Requirement 5: Redirect directly to Assessment page
    navigate("/assessment", { replace: true });
  };

  if (loadingCheck) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FBF8F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B332C] border-t-transparent"></div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            Checking onboarding status...
          </p>
        </div>
      </div>
    );
  }

  const careerGoalOptions = field ? CAREER_GOALS_BY_FIELD[field] || [] : [];

  return (
    <Section className="py-16 flex-1 bg-[#FBF8F0]">
      <Container>
        {/* Progress indicator */}
        {step >= 1 && step <= TOTAL_STEPS && (
          <div className="mx-auto mb-12 max-w-xl">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
              <span>
                Step {step} of {TOTAL_STEPS}
              </span>
              <span>{Math.round((step / TOTAL_STEPS) * 100)}% Completed</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    i < step ? "bg-[#1B332C]" : "bg-[#2E4F42]/15"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ---------------- STEP 1: WELCOME ---------------- */}
        {step === 1 && (
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="flex flex-col items-start gap-5 text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2E4F42]/20 bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#C4952A]" style={{ fontFamily: "var(--font-mono)" }}>
                ✨ AI-POWERED ONBOARDING
              </span>
              <h1 className="max-w-lg text-4xl font-bold tracking-tight text-[#1B332C] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Welcome to your AI Learning Observatory
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-[var(--color-text-muted)]">
                Let's personalize your learning path and target skills to help you track your progress accurately.
              </p>
              <Button size="lg" onClick={goNext} className="mt-2 shadow-md">
                Get Started →
              </Button>
            </div>

            <div className="mx-auto w-full max-w-sm">
              <ImageCard
                image={WELCOME_ILLUSTRATION}
                alt="AI Learning illustration"
                title="Personalized Skill Pathways"
                description="Your selected target field shapes mock assessments and gap analysis."
                hoverable={false}
              />
            </div>
          </div>
        )}

        {/* ---------------- STEP 2: FIELD SELECTION ---------------- */}
        {step === 2 && (
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              title="What field are you focused on?"
              subtitle="Choose your primary career domain. Can't find yours? Type it below."
            />

            {isFieldLocked && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="font-bold">Target Field Locked</p>
                  <p className="text-xs text-amber-800">
                    Your target domain is permanently set to <strong>{field}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Search bar */}
            {!isFieldLocked && (
              <div className="mb-6 relative">
                <input
                  type="text"
                  placeholder="🔍  Search fields... (e.g. Medicine, AI, Law, Fashion)"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#2E4F42]/20 bg-white px-4 py-3 text-sm text-[#1B332C] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B332C]/30 focus:border-[#1B332C]/50 transition-all"
                  style={{ fontFamily: "var(--font-body)" }}
                />
                {fieldSearch && (
                  <button
                    onClick={() => setFieldSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2E4F42]/40 hover:text-[#1B332C] text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
              {filteredFields.map((f) => (
                <SelectableCard
                  key={f}
                  icon={FIELD_ICONS[f]}
                  title={f}
                  selected={field === f}
                  disabled={isFieldLocked && field !== f}
                  onSelect={() => {
                    if (!isFieldLocked) {
                      setField(f);
                      setCustomField("");
                    }
                  }}
                />
              ))}
              {filteredFields.length === 0 && !fieldSearch && (
                <p className="col-span-full text-center text-sm text-[var(--color-text-muted)] py-6">
                  Loading fields...
                </p>
              )}
              {filteredFields.length === 0 && fieldSearch && (
                <div className="col-span-full rounded-3xl border border-amber-300 bg-white/95 p-6 sm:p-7 shadow-md my-2 text-left">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl border border-amber-200">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#1B332C]">
                        Course &lsquo;{fieldSearch}&rsquo; is not in our curriculum
                      </h3>
                      <p className="text-xs text-[#5B6B5F] mt-1 leading-relaxed">
                        To maintain high quality standards, AIFinity only provides assessments and structured roadmaps for verified academic and professional domains. Please select a recognized domain from our catalog below.
                      </p>
                    </div>
                  </div>

                  {/* Related Fields */}
                  {getRelatedFields(fieldSearch).length > 0 && (
                    <div className="mt-5 rounded-2xl border border-[#2E4F42]/15 bg-[#FBF8F0] p-4">
                      <p className="text-xs font-bold text-[#1B332C] mb-2">
                        🎯 Closest recognized tracks in our catalog:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getRelatedFields(fieldSearch).map((rf) => (
                          <button
                            key={rf}
                            type="button"
                            onClick={() => {
                              setField(rf);
                              setFieldSearch("");
                              setCustomField("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2E4F42]/20 bg-white px-3.5 py-2 text-xs font-bold text-[#1B332C] hover:border-[#C4952A] hover:bg-[#f5f0e6] transition-all cursor-pointer shadow-xs"
                          >
                            <span>{FIELD_ICONS[rf] || "📚"}</span>
                            <span>{rf}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFieldSearch("")}
                      className="rounded-xl border border-[#1B332C] bg-[#1B332C] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#E8C547] hover:bg-[#2E4F42] transition-colors cursor-pointer"
                    >
                      Browse All 30+ Verified Fields
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestCoursePrefill(fieldSearch);
                        setIsCourseRequestModalOpen(true);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      📩 Request Course from Admin
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CTA below existing course list/cards */}
            {!isFieldLocked && filteredFields.length > 0 && (
              <div className="mt-5 rounded-2xl border border-[#2E4F42]/15 bg-white p-4 sm:p-5 text-center shadow-xs">
                <p className="text-xs sm:text-sm font-bold text-[#1B332C]">
                  Can't find the course you're looking for?
                </p>
                <p className="text-xs text-[#5B6B5F] mt-0.5 mb-2.5">
                  Request any domain or skill track directly from our administration team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRequestCoursePrefill(fieldSearch || "");
                    setIsCourseRequestModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#E8C547] border border-[#C4952A]/40 hover:bg-[#2E4F42] transition-colors cursor-pointer"
                >
                  + Request a New Course
                </button>
              </div>
            )}

            {/* Active selection feedback */}
            {field && (
              <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-900 flex items-center justify-between animate-fade-in">
                <span>
                  ✓ Selected Domain: <strong>{field}</strong>
                </span>
                <span className="font-semibold text-emerald-700">Click Continue below &rarr;</span>
              </div>
            )}

            <StepNav onBack={goBack} onNext={goNext} showBack={!isFieldLocked} nextDisabled={!field} />
          </div>
        )}

        {/* ---------------- STEP 3: CURRENT LEVEL ---------------- */}
        {step === 3 && (
          <div className="mx-auto max-w-2xl">
            <SectionHeading
              title="Where are you right now?"
              subtitle={`Assess your current skill level in ${field || "your target field"}.`}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {LEVEL_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.title}
                  title={option.title}
                  description={option.description}
                  selected={level === option.title}
                  onSelect={() => setLevel(option.title)}
                />
              ))}
            </div>

            <StepNav onBack={goBack} onNext={goNext} showBack={!isFieldLocked} nextDisabled={!level} />
          </div>
        )}

        {/* ---------------- STEP 4: CAREER GOAL ---------------- */}
        {step === 4 && (
          <div className="mx-auto max-w-2xl">
            <SectionHeading
              title={`What's your career goal in ${field}?`}
              subtitle="Select your target role from verified industry tracks, or specify a customized career goal."
            />

            {/* Predefined career goals for this field */}
            {CAREER_GOALS_BY_FIELD[field] && CAREER_GOALS_BY_FIELD[field].length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#C4952A] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
                  🎯 Verified Career Roles in {field}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAREER_GOALS_BY_FIELD[field].map((goal) => {
                    const isSelected = careerGoal === goal && !customCareerGoal;
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => {
                          setCareerGoal(goal);
                          setCustomCareerGoal("");
                        }}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#1B332C] bg-[#1B332C] text-[#E8C547] shadow-md ring-2 ring-[#E8C547]/30"
                            : "border-[#2E4F42]/15 bg-white hover:border-[#1B332C]/40 text-[#1B332C] hover:bg-[#FBF8F0]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{goal}</span>
                          {isSelected && <span className="text-xs text-[#E8C547] font-extrabold">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom career goal text input with validation */}
            <div className="mt-6 rounded-xl border border-dashed border-[#2E4F42]/25 bg-[#f5f0e6] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C4952A] mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                ✨ Or type a specific focus role
              </p>
              <input
                type="text"
                placeholder={getCareerGoalPlaceholder(field)}
                value={customCareerGoal}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomCareerGoal(val);
                  const spam = ["hi", "hii", "hello", "test", "testing", "asdf", "qwerty", "1234"];
                  if (val.trim() && val.trim().length >= 3 && !spam.includes(val.trim().toLowerCase())) {
                    setCareerGoal(val.trim());
                  } else if (!val.trim()) {
                    setCareerGoal(null);
                  }
                }}
                className="w-full rounded-lg border border-[#2E4F42]/15 bg-white px-4 py-3 text-sm text-[#1B332C] focus:outline-none focus:ring-2 focus:ring-[#1B332C]/30 transition-all"
              />
              {customCareerGoal && customCareerGoal.trim().length < 3 && (
                <p className="mt-2 text-xs text-rose-600 font-semibold">
                  ⚠️ Please enter at least 3 letters for your role.
                </p>
              )}
              {customCareerGoal && ["hi", "hii", "hello", "test", "asdf"].includes(customCareerGoal.trim().toLowerCase()) && (
                <p className="mt-2 text-xs text-rose-600 font-semibold">
                  ⚠️ Please enter a real professional role or target career.
                </p>
              )}
              {careerGoal && (!customCareerGoal || (customCareerGoal.trim().length >= 3 && !["hi", "hii", "hello", "test", "asdf"].includes(customCareerGoal.trim().toLowerCase()))) && (
                <p className="mt-2 text-xs text-emerald-700 font-semibold">
                  ✓ Selected Goal: <strong>{careerGoal}</strong>
                </p>
              )}
            </div>

            <StepNav
              onBack={goBack}
              onNext={goNext}
              showBack
              nextLabel="Continue →"
              nextDisabled={!careerGoal || (customCareerGoal && (customCareerGoal.trim().length < 3 || ["hi", "hii", "hello", "test", "asdf"].includes(customCareerGoal.trim().toLowerCase())))}
            />
          </div>
        )}

        {/* ---------------- STEP 5: FINAL MOTIVATIONAL SCREEN ---------------- */}
        {step === 5 && (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1B332C] text-4xl text-[#E8C547] shadow-lg">
              ✓
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-[#1B332C] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              You're all set!
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-[var(--color-text-muted)]">
              Your personalized AI learning path for <strong className="text-[#1B332C]">{field}</strong> is ready. Time to evaluate your skills.
            </p>

            {error && (
              <div className="w-full rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <Button
              size="lg"
              onClick={handleStartLearning}
              disabled={saving}
              className="mt-2 w-full max-w-xs shadow-lg text-base py-3.5"
            >
              {saving ? "Saving Onboarding..." : "Start Learning →"}
            </Button>
          </div>
        )}
      </Container>

      {/* Course Request Modal */}
      <CourseRequestModal
        isOpen={isCourseRequestModalOpen}
        onClose={() => setIsCourseRequestModalOpen(false)}
        initialCourseName={requestCoursePrefill}
        onSuccess={() => {
          setIsCourseRequestModalOpen(false);
          setFieldSearch("");
        }}
      />
    </Section>
  );
}

/* ---------------- Local helpers ---------------- */

function SelectableCard({ icon, title, description, selected, disabled, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`text-left transition-all duration-150 focus:outline-none ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div
        className={`relative rounded-2xl transition-all duration-150 ${
          selected
            ? "ring-2 ring-[#1B332C] ring-offset-2 bg-white shadow-md scale-[1.01]"
            : "border border-[#2E4F42]/15 bg-white hover:border-[#1B332C]/40"
        }`}
      >
        {selected && (
          <span className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B332C] text-xs font-bold text-[#E8C547] shadow-sm">
            ✓
          </span>
        )}
        <Card
          icon={
            icon ? (
              <span className="text-lg font-bold text-[#1B332C]">
                {icon}
              </span>
            ) : undefined
          }
          title={title}
          hoverable={!selected && !disabled}
          className="border-transparent bg-transparent"
        >
          {description}
        </Card>
      </div>
    </button>
  );
}

function StepNav({ onBack, onNext, showBack, nextLabel = "Next →", nextDisabled = false }) {
  return (
    <div className="mt-10 flex items-center justify-between">
      {showBack ? (
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
      ) : (
        <span />
      )}
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </div>
  );
}