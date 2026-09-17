import AttemptResult from "../models/AttemptResult.js";
import User from "../models/User.js";
import UserRoadmap from "../models/UserRoadmap.js";
import { generateProjectIdeasWithAI } from "../services/geminiService.js";
import { buildMistakeMapAnalysis } from "../services/mistakeMapService.js";

/**
 * Cleans raw internal topic/category names before showing to users.
 * Strips prefixes like "ai_rec_", URL-encoded characters, and trims whitespace.
 */
export function cleanTopicName(name) {
  if (!name) return "General";
  let str = String(name);
  try {
    str = decodeURIComponent(str);
  } catch (_) {}

  // Strip internal artificial prefixes globally
  str = str.replace(/ai_rec_/gi, "");
  str = str.replace(/_/g, " ");

  // If it's a synthetic benchmark artifact for social science class 10th:
  if (/social science/i.test(str) && /class 10/i.test(str)) {
    if (/core principles/i.test(str) || /practical application/i.test(str)) {
      return "Class 10 Social Science: History & Civics";
    }
    return "Class 10 Social Science (SST)";
  }

  // Strip trailing placeholder suffixes from general fields
  str = str.replace(/\s+Core Principles$/i, " Fundamentals");
  str = str.replace(/\s+Practical Application$/i, " Applied Concepts");
  str = str.replace(/\s+/g, " ").trim();

  // Title-case if first char is lowercase
  return str.replace(/^(\w)/, (c) => c.toUpperCase());
}

/**
 * Returns tailored academic curriculum for school and board exam subjects.
 */
export function getAcademicCurriculum(goal = "", field = "") {
  const combined = `${goal} ${field}`.toLowerCase();
  
  const isSocialScience = /social science|sst|history|geography|civics|economics/i.test(combined);
  const isScience = /science/i.test(combined) && !isSocialScience && !/data science/i.test(combined);
  const isMath = /math|algebra|geometry|calculus/i.test(combined);

  if (isSocialScience) {
    return {
      isAcademic: true,
      subjectName: "Class 10 Social Science (SST)",
      units: [
        "History: The Rise of Nationalism in Europe & India",
        "Geography: Resources, Agriculture & Mineral Wealth",
        "Political Science: Power Sharing, Federalism & Political Parties",
        "Economics: Development, Sectors of Economy, Money & Credit",
        "Board Exam PYQs: 5-10 Years Chapter-wise Previous Year Questions",
        "Board Blueprint: 3-Mark & 5-Mark Answer Writing & Map Skills"
      ],
      phase1: {
        title: "Phase 1: Syllabus Mastery & NCERT Foundations",
        phase: "NCERT Textbook Mastery (0-25% Readiness)",
        description: "Master core chapter concepts, historical timelines, and NCERT in-text & exercise questions across History, Geography, Civics, and Economics.",
        tasks: [
          "Read NCERT textbook chapters thoroughly and highlight key terms & definitions",
          "Prepare 1-page revision mind maps and historical timeline charts",
          "Solve all NCERT in-text and chapter-end exercise questions",
          "Practice 20+ concept-based MCQs to verify textbook clarity"
        ],
        topics: [
          "The Rise of Nationalism in Europe & India",
          "Resources, Development & Agriculture (Geography)",
          "Power Sharing & Federalism (Political Science)",
          "Development & Sectors of Economy (Economics)"
        ]
      },
      phase2: {
        title: "Phase 2: High-Weightage Chapters & Board PYQs",
        phase: "Board Exam Competence (25-50% Readiness)",
        description: "Solve 5-10 years of Board Exam Previous Year Questions (PYQs), master high-weightage chapters, and learn step-wise marking schemes.",
        tasks: [
          "Solve last 5-10 years of Board Exam PYQs for high-weightage chapters",
          "Practice structured 3-mark short answers and 5-mark long answers in bullet points",
          "Practice History & Geography map pointing questions on outline maps",
          "Analyze Board marking schemes and step-marking guidelines"
        ],
        topics: [
          "Board Exam PYQs: Last 10 Years Chapter-wise Questions",
          "Nationalism in India (High-Weightage 5-Mark Questions)",
          "Money and Credit & Globalisation (Economics)",
          "Minerals, Energy Resources & Map Pointing Skills"
        ]
      },
      phase3: {
        title: "Phase 3: Targeted Weakness Remediation & Mistake Elimination",
        phase: "Exam Precision (50-75% Readiness)",
        description: "Overcome weak chapters identified in tests, eliminate recurring mistakes, and master tricky Assertion-Reason & Case-Based questions.",
        tasks: [
          "Revise topics flagged in MistakeMap and benchmark assessment",
          "Solve 30+ Assertion-Reason and Case-Based questions from Board Question Banks",
          "Re-attempt missed assessment questions until achieving 100% accuracy",
          "Attempt a 45-minute timed sectional assessment"
        ],
        topics: [
          "Assertion-Reason & Case-Based Source Questions",
          "Targeted Practice on Identified Weak Concepts",
          "Geography Map Work Drills (Dams, Ports, Mineral Mines)",
          "Historical Dates, Timelines & Economic Indicators"
        ]
      },
      phase4: {
        title: "Phase 4: CBSE Sample Papers & Full Mock Board Exams",
        phase: "Board Exam Ready (75-100% Target 95%+)",
        description: "Simulate real 3-hour Board Exam papers under timed conditions with model answer sheet presentation.",
        tasks: [
          "Solve 3 full-length 3-hour Board Mock Papers under exam conditions",
          "Practice neat handwriting, headings, bullet points, and underlined keywords",
          "Compare answers against CBSE official model answer keys",
          "Perform final rapid revision of key dates, maps, and core definitions"
        ],
        topics: [
          "CBSE Official Sample Papers (Latest Board Pattern)",
          "Pre-Board Examination Papers & Model Solutions",
          "Board Answer Sheet Presentation & Time Allocation Strategy",
          "CBSE Topper Answer Sheet Analysis & Keyword Underlining"
        ]
      }
    };
  }

  if (isScience && (/10/i.test(combined) || /board/i.test(combined) || /class/i.test(combined))) {
    return {
      isAcademic: true,
      subjectName: "Class 10 Science",
      units: [
        "Chemical Reactions, Acids, Bases & Salts",
        "Life Processes & Control and Coordination",
        "Light: Reflection, Refraction & Human Eye",
        "Electricity & Magnetic Effects of Current",
        "Board Exam PYQs: Last 10 Years Science Papers & Numericals",
        "Ray Diagrams & Chemical Equation Balancing"
      ],
      phase1: {
        title: "Phase 1: NCERT Concepts & Formula Mastery",
        phase: "Theory Mastery (0-25% Readiness)",
        description: "Master NCERT textbook concepts, chemical reactions, ray diagrams, and core biological processes.",
        tasks: [
          "Read NCERT textbook chapters and highlight chemical equations & laws",
          "Prepare formula sheets for Light & Electricity and reaction charts",
          "Solve NCERT in-text and exemplar questions",
          "Practice balancing 25+ chemical equations"
        ],
        topics: [
          "Chemical Reactions & Equations",
          "Life Processes (Nutrition, Respiration, Transport)",
          "Light: Reflection & Refraction",
          "Acids, Bases & Salts"
        ]
      },
      phase2: {
        title: "Phase 2: Numericals, Ray Diagrams & Board PYQs",
        phase: "Problem Solving (25-50% Readiness)",
        description: "Practice physics numericals, ray diagrams, biology diagrams, and 5-10 years of Board Exam PYQs.",
        tasks: [
          "Solve last 5-10 years of Board PYQs for high-weightage chapters",
          "Practice mirror & lens numericals and electricity circuit problems",
          "Draw and label Biology diagrams (Nephron, Heart, Brain, Flower)",
          "Practice step-wise derivation and law statements"
        ],
        topics: [
          "Board Exam PYQs: Last 10 Years Science Papers",
          "Electricity Numericals & Ohm's Law",
          "Ray Diagrams: Spherical Mirrors & Lenses",
          "Metals, Non-Metals & Carbon Compounds"
        ]
      },
      phase3: {
        title: "Phase 3: Targeted Weak Chapter Practice & Assertion-Reason",
        phase: "Exam Precision (50-75% Readiness)",
        description: "Eliminate recurring errors from benchmark assessments and master Assertion-Reason and experimental skill questions.",
        tasks: [
          "Revise weak chapters flagged in tests",
          "Solve 30+ Assertion-Reason and Case-Based questions",
          "Practice lab-based practical questions (pH, resistors, stomata slide)",
          "Re-attempt missed assessment questions"
        ],
        topics: [
          "Assertion-Reason & Case-Based Scientific Analysis",
          "Practical-Based MCQs & Lab Skills",
          "Targeted Practice on Identified Weak Concepts",
          "Magnetic Effects of Current & Solenoids"
        ]
      },
      phase4: {
        title: "Phase 4: Full Board Mock Exams & Time Management",
        phase: "Board Exam Ready (75-100% Target 95%+)",
        description: "Simulate 3-hour full syllabus board science exams and master step-marking answer presentation.",
        tasks: [
          "Attempt 3 full-length timed Board Mock Papers (3 hours each)",
          "Write neat answers with balanced equations and labeled diagrams",
          "Review CBSE model answer marking schemes",
          "Rapid formula and reaction revision before exam"
        ],
        topics: [
          "CBSE Official Science Sample Papers",
          "Full Syllabus Pre-Board Practice Papers",
          "Time Management & Section-wise Strategy",
          "Model Answer Paper Review"
        ]
      }
    };
  }

  if (isMath && (/10/i.test(combined) || /board/i.test(combined) || /class/i.test(combined))) {
    return {
      isAcademic: true,
      subjectName: "Class 10 Mathematics",
      units: [
        "Real Numbers, Polynomials & Quadratic Equations",
        "Arithmetic Progressions & Coordinate Geometry",
        "Triangles: Theorems & Similarity Proofs",
        "Trigonometry: Identities, Heights & Distances",
        "Board Exam PYQs: Last 10 Years Maths Papers",
        "Surface Areas, Volumes, Statistics & Probability"
      ],
      phase1: {
        title: "Phase 1: NCERT Exercise & Theorem Mastery",
        phase: "Foundations (0-25% Readiness)",
        description: "Solve all NCERT textbook exercises, understand key formulas, and learn standard theorem proofs.",
        tasks: [
          "Solve all NCERT exercise problems step-by-step",
          "Memorize and write theorem proofs (BPT, Tangent theorem)",
          "Create a master formula sheet for Mensuration, Trigonometry & Stats",
          "Practice 25+ basic calculation and formula application MCQs"
        ],
        topics: [
          "Real Numbers & Polynomials",
          "Quadratic Equations & Arithmetic Progressions",
          "Introduction to Trigonometry & Identities",
          "Triangles & Basic Proportionality Theorem"
        ]
      },
      phase2: {
        title: "Phase 2: High-Weightage Chapters & Board PYQs",
        phase: "Problem Solving (25-50% Readiness)",
        description: "Solve 5-10 years of Board Exam PYQs, NCERT Exemplar problems, and 4-mark / 5-mark long questions.",
        tasks: [
          "Solve last 5-10 years of Board PYQs chapter-wise",
          "Practice Heights & Distances (Applications of Trigonometry)",
          "Solve NCERT Exemplar problems for Triangles and Surface Areas",
          "Practice step-wise working and justification of each step"
        ],
        topics: [
          "Board Exam PYQs: Last 10 Years Maths Papers",
          "Heights & Distances (Word Problems)",
          "Surface Areas & Volumes of Combinations",
          "Statistics (Mean, Median, Mode) & Probability"
        ]
      },
      phase3: {
        title: "Phase 3: Targeted Weak Concept Practice & Case Studies",
        phase: "Exam Precision (50-75% Readiness)",
        description: "Fix calculation errors, master 4-mark Case-Based questions, and eliminate mistakes detected in assessments.",
        tasks: [
          "Revise weak chapters flagged in tests",
          "Solve 20+ Case-Study based questions (Standard Board format)",
          "Practice speed math and calculation accuracy checks",
          "Re-attempt missed assessment problems"
        ],
        topics: [
          "Case-Based Integrated Mathematics Questions",
          "Targeted Practice on Identified Weak Concepts",
          "Circles & Tangent Properties",
          "Coordinate Geometry (Distance & Section Formula)"
        ]
      },
      phase4: {
        title: "Phase 4: Full Board Mock Exams & Time Management",
        phase: "Board Exam Ready (75-100% Target 95%+)",
        description: "Take full 3-hour mock board exams, perfect time management, and eliminate step-loss errors.",
        tasks: [
          "Solve 3 full-length 3-hour Board Mock Papers under exam conditions",
          "Ensure neat rough work margins and step-by-step mathematical reasoning",
          "Compare answers against CBSE marking schemes",
          "Final revision of all identities, theorem statements, and formulas"
        ],
        topics: [
          "CBSE Official Mathematics Sample Papers",
          "Full Syllabus Pre-Board Practice Papers",
          "Time Allocation: Section A to Section E Strategy",
          "Model Answer Sheet Presentation"
        ]
      }
    };
  }

  // Any other school/board course
  if (/class \d|board|cbse|icse|ncert/i.test(combined)) {
    const cleanGoal = goal ? cleanTopicName(goal) : "Academic Subject";
    return {
      isAcademic: true,
      subjectName: cleanGoal,
      units: [
        `${cleanGoal} Core Syllabus & NCERT Concepts`,
        `${cleanGoal} High-Weightage Chapters`,
        `${cleanGoal} Board Exam PYQs & Chapter-wise Questions`,
        `${cleanGoal} Assertion-Reason & Case-Based Drills`,
        `${cleanGoal} Mock Exams & Answer Presentation`
      ],
      phase1: {
        title: `Phase 1: Syllabus Mastery & NCERT Foundations`,
        phase: "Textbook Concepts (0-25% Readiness)",
        description: `Master core chapter theory, key definitions, and NCERT exercise questions for ${cleanGoal}.`,
        tasks: [
          `Read NCERT textbook chapters and prepare chapter summary notes`,
          `Highlight key formulas, laws, and important definitions`,
          `Solve in-text and chapter-end NCERT exercise questions`,
          `Practice 20+ concept-based MCQs`
        ],
        topics: [`${cleanGoal} Chapter 1 & 2 Core Theory`, `${cleanGoal} Basic Definitions & Concepts`]
      },
      phase2: {
        title: `Phase 2: High-Weightage Chapters & Board PYQs`,
        phase: "Board Competence (25-50% Readiness)",
        description: `Solve 5 to 10 years of Board Previous Year Questions (PYQs) and master high-weightage topics.`,
        tasks: [
          `Solve last 5-10 years of Board Exam PYQs`,
          `Practice structured 3-mark and 5-mark answer writing`,
          `Review official marking schemes for step-marking marks`,
          `Identify repeated board exam questions`
        ],
        topics: [`Board Exam PYQs: Last 10 Years`, `${cleanGoal} High-Weightage Units`]
      },
      phase3: {
        title: `Phase 3: Targeted Weakness Remediation & Mistake Elimination`,
        phase: "Exam Precision (50-75% Readiness)",
        description: `Fix weak areas identified in test attempts and eliminate recurring errors.`,
        tasks: [
          `Revise topics flagged in test mistake maps`,
          `Solve 25+ Assertion-Reason and Case-Based questions`,
          `Re-attempt missed assessment questions until 100% correct`,
          `Attempt timed chapter-wise sectional mock tests`
        ],
        topics: [`Targeted Weakness Remediation`, `Assertion-Reason & Case-Based Practice`]
      },
      phase4: {
        title: `Phase 4: Official Sample Papers & Full Mock Board Exams`,
        phase: "Board Exam Ready (75-100% Target 95%+)",
        description: `Simulate full 3-hour Board Exam papers under timed conditions with model answer sheet presentation.`,
        tasks: [
          `Solve 3 full-length timed Board Mock Papers (3 hours each)`,
          `Practice neat handwriting, headings, bullet points, and underlined keywords`,
          `Compare answers against official model answer keys`,
          `Perform final rapid revision of key formulas and definitions`
        ],
        topics: [`Official Board Sample Papers`, `Pre-Board Examination Practice`]
      }
    };
  }

  return { isAcademic: false };
}

/**
 * Role to required skills dictionary
 */
const ROLE_SKILLS_MAP = {
  "Software Developer": ["Problem Solving", "Programming", "Data Structures", "System Design", "Web APIs"],
  "Full-Stack Software Engineer": ["Frontend Architecture", "State Management & Hooks", "Node.js & Express APIs", "Databases & Security", "CI/CD & Cloud Deployment"],
  "Data Scientist": ["Python for Data Science", "Pandas & Dataframes", "Linear Algebra & Statistics", "Scikit-Learn Modeling", "Deep Learning & MLOps"],
  "Data Scientist & AI Specialist": ["Python Dataframes", "Statistical ML", "PyTorch / TensorFlow", "NLP & LLMs", "MLOps Pipelines"],
  "Financial & Investment Analyst": ["Financial Statements", "DCF & Valuation Frameworks", "Scenario & Sensitivity Analysis", "Equity Research & Pitching"],
  "Machine Learning Engineer": ["Python", "Machine Learning", "Deep Learning", "NLP & LLMs", "MLOps & Model Deployment"],
  "Frontend Engineer": ["HTML & CSS", "JavaScript ES6", "React Architecture", "State Management", "Web Performance"],
  "Backend Engineer": ["Node.js & Express", "Database Design", "API Security", "Caching & Architecture", "System Design"],
  "Class 10 Social Science (SST)": ["Nationalism & Historical Timelines", "Resources, Agriculture & Map Skills", "Democratic Politics & Federalism", "Economic Sectors & Money Credit", "Board Exam Case-Based & Answer Writing"],
  "SST": ["Nationalism & Historical Timelines", "Resources, Agriculture & Map Skills", "Democratic Politics & Federalism", "Economic Sectors & Money Credit", "Board Exam Case-Based & Answer Writing"],
  "Software Development": ["Problem Solving", "Data Structures", "System Design", "Web APIs", "Version Control"],
  "Data Science & Analytics": ["Python", "Pandas", "Statistics", "Machine Learning", "Data Visualization"],
  "Web Development": ["HTML & CSS", "JavaScript", "React", "Node.js", "Databases"],
  "Mobile App Development": ["React Native", "Flutter", "Swift", "Kotlin", "Mobile UI"],
  "AI & Machine Learning": ["Neural Networks", "NLP", "TensorFlow", "MLOps", "Deep Learning"],
  "Cybersecurity": ["Network Security", "Cryptography", "Ethical Hacking", "Risk Assessment", "Incident Response"],
  "Cloud Computing & DevOps": ["AWS/Azure", "Docker", "Kubernetes", "CI/CD", "Infrastructure as Code"],
  "Graphic Design & UI/UX": ["Figma", "Typography", "User Research", "Wireframing", "Prototyping"],
  "Digital Marketing": ["SEO", "Content Marketing", "Social Media", "Analytics", "Paid Advertising"],
  "Business & Management": ["Strategic Planning", "Leadership", "Financial Basics", "Operations", "Project Management"],
  "Finance & Accounting": ["Financial Statements", "Corporate Finance", "Taxation", "Auditing", "Financial Modeling"],
  "Mechanical Engineering": ["Thermodynamics", "Fluid Mechanics", "CAD", "Manufacturing", "Material Science"],
  "Electrical & Electronics": ["Circuit Design", "Microcontrollers", "Signals & Systems", "Power Systems", "Electromagnetics"],
  "Civil Engineering": ["Structural Analysis", "Geotechnical", "Surveying", "Construction Management", "Transportation"],
  "Medicine & Healthcare": ["Anatomy", "Pathology", "Patient Care", "Medical Ethics", "Pharmacology"],
  "Law & Legal Studies": ["Constitutional Law", "Contracts", "Criminal Law", "Legal Writing", "Corporate Law"],
  "Psychology & Counseling": ["Cognitive Psychology", "Behavioral Therapy", "Research Methods", "Counseling Techniques", "Abnormal Psychology"],
  "Education & Teaching": ["Pedagogy", "Curriculum Design", "Classroom Management", "Educational Psychology", "Assessment Techniques"],
  "Media & Communication": ["Journalism", "Public Relations", "Media Ethics", "Broadcasting", "Digital Media"],
  "Architecture & Interior Design": ["Architectural Design", "Building Materials", "AutoCAD/Revit", "Urban Planning", "3D Rendering"],
  "Clinical Psychologist": ["Cognitive Behavioral Therapy", "Psychological Assessment", "Clinical Interviewing", "Abnormal Psychology", "Research Methodology"],
};

function getRequiredSkillsForRole(role) {
  if (!role) return ROLE_SKILLS_MAP["Full-Stack Software Engineer"];
  const normalised = role.toLowerCase();

  const academic = getAcademicCurriculum(role, "");
  if (academic.isAcademic) {
    return academic.units;
  }

  for (const [key, skills] of Object.entries(ROLE_SKILLS_MAP)) {
    if (normalised.includes(key.toLowerCase()) || key.toLowerCase().includes(normalised)) {
      return skills;
    }
  }
  return ["Core Logic", "Problem Solving", "Domain Fundamentals", "Best Practices", "Applied Execution"];
}

// ─────────────────────────────────────────────
// 1. GET /api/analytics/skill-gap
// ─────────────────────────────────────────────
export async function getSkillGapAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).lean();
    const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();

    const targetCareer = user?.onboardingProfile?.careerGoal || user?.selectedField || "Full-Stack Software Engineer";
    const requiredSkills = getRequiredSkillsForRole(targetCareer);

    if (!attempts || attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          hasHistory: false,
          targetCareer,
          demonstratedCapability: 0,
          averageGap: 40,
          matchPercentage: 0,
          strengths: [],
          weakSkills: requiredSkills.map((name) => ({ name, status: "attention", avgScore: 0 })),
          requiredSkills: requiredSkills.map((name) => ({ name, required: true, status: "upcoming" })),
          recommendations: [
            "Take your first assessment to calculate your personalized skill gap",
            `Complete assessments in ${targetCareer} topics`,
            "Review concept root causes for any missed questions",
          ],
        },
      });
    }

    const totalAttempts = attempts.length;
    const overallAvgScore = Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts);
    const averageGap = Math.max(0, 100 - overallAvgScore);

    // Group scores by category
    const catMap = {};
    attempts.forEach((a) => {
      const cat = a.assessmentCategory || "General";
      if (!catMap[cat]) catMap[cat] = { sum: 0, count: 0 };
      catMap[cat].sum += a.scorePercent;
      catMap[cat].count++;
    });

    const categoryStats = Object.entries(catMap).map(([category, { sum, count }]) => ({
      category,
      avgScore: Math.round(sum / count),
      count,
    }));

    const strengths = categoryStats.filter((c) => c.avgScore >= 75).map((c) => c.category);
    if (strengths.length === 0 && overallAvgScore >= 60) {
      strengths.push("Core Reasoning", "Basic Concepts");
    }

    const weakSkills = categoryStats.filter((c) => c.avgScore < 70).map((c) => ({
      name: c.category,
      avgScore: c.avgScore,
      gapPoints: 100 - c.avgScore,
      status: c.avgScore >= 55 ? "improving" : "attention",
    }));

    const skillsBreakdown = categoryStats.map((c) => ({
      name: c.category,
      avgScore: c.avgScore,
      status: c.avgScore >= 75 ? "strong" : c.avgScore >= 55 ? "improving" : "attention",
    }));

    const recommendations = [];
    if (weakSkills.length > 0) {
      weakSkills.forEach((w) => {
        recommendations.push(`Improve accuracy in ${w.name} (currently ${w.avgScore}%) to close the ${w.gapPoints}-point gap.`);
      });
    } else {
      recommendations.push("Your performance is strong across evaluated areas. Challenge yourself with advanced assessments.");
    }
    recommendations.push(`Align remaining milestones with your target career goal: ${targetCareer}.`);

    return res.json({
      success: true,
      data: {
        hasHistory: true,
        targetCareer,
        demonstratedCapability: overallAvgScore,
        averageGap,
        matchPercentage: overallAvgScore,
        strengths,
        weakSkills,
        skillsBreakdown,
        requiredSkills: requiredSkills.map((name) => {
          const match = categoryStats.find((c) => c.category.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.category.toLowerCase()));
          return {
            name,
            status: match ? (match.avgScore >= 75 ? "strong" : match.avgScore >= 55 ? "improving" : "attention") : "upcoming",
            score: match ? match.avgScore : null,
          };
        }),
        recommendations: recommendations.slice(0, 4),
      },
    });
  } catch (err) {
    console.error("[Analytics] Error in getSkillGapAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to calculate SkillGap analytics." });
  }
}

// ─────────────────────────────────────────────
// 2. GET /api/analytics/mistake-map
// ─────────────────────────────────────────────
export async function getMistakeMapAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
    const analysis = buildMistakeMapAnalysis(attempts, {
      careerGoal: req.user.onboardingProfile?.careerGoal || req.user.selectedField || "",
    });

    if (!analysis.hasData) {
      return res.json({
        success: true,
        data: {
          hasHistory: false,
          totalMistakes: 0,
          mostCommonMistake: "No mistake patterns detected yet",
          occurrences: 0,
          topicProgress: [],
          mistakePatterns: [],
          ...analysis,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        hasHistory: true,
        totalMistakes: analysis.summary.totalMistakes,
        mostCommonMistake: analysis.summary.mostCommonWeakness,
        occurrences: analysis.highPriorityConcepts.length > 0 ? analysis.highPriorityConcepts[0].mistakeCount : 0,
        improvement: analysis.trends.improvedCount > 0 ? Math.round((analysis.trends.improvedCount / Math.max(1, analysis.concepts.length)) * 100) : 0,
        topicProgress: analysis.trends.topicProgress,
        mistakePatterns: analysis.concepts.map((c) => ({
          concept: c.concept,
          occurrences: c.mistakeCount,
          accuracy: c.accuracy,
          primaryMistakeType: c.primaryMistakeType,
          learningPriority: c.learningPriority,
          explanation: c.evidence,
        })),
        ...analysis,
      },
    });
  } catch (err) {
    console.error("[Analytics] Error in getMistakeMapAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to calculate MistakeMap analytics." });
  }
}

// ─────────────────────────────────────────────
// 3. GET /api/analytics/concept-root
// ─────────────────────────────────────────────
export async function getConceptRootAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();

    if (!attempts || attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          hasHistory: false,
          analyzedCount: 0,
          strongCount: 0,
          attentionCount: 0,
          concepts: [],
        },
      });
    }

    let totalQuestionsAnalyzed = 0;
    const catMap = {};

    attempts.forEach((a) => {
      totalQuestionsAnalyzed += a.totalQuestions || 0;
      const cat = a.assessmentCategory || "General";
      if (!catMap[cat]) catMap[cat] = { sum: 0, count: 0 };
      catMap[cat].sum += a.scorePercent;
      catMap[cat].count++;
    });

    const concepts = Object.entries(catMap).map(([name, { sum, count }]) => {
      const avgScore = Math.round(sum / count);
      return {
        name,
        avgScore,
        status: avgScore >= 75 ? "strong" : avgScore >= 55 ? "improving" : "attention",
        rootCause: avgScore >= 75
          ? "Solid conceptual foundation demonstrated."
          : avgScore >= 55
          ? "Good grasp of basic syntax and definitions; needs practice on complex edge cases."
          : "Gaps identified in core mechanics. Review foundational prerequisites.",
      };
    });

    const strongCount = concepts.filter((c) => c.status === "strong").length;
    const attentionCount = concepts.filter((c) => c.status === "attention").length;

    return res.json({
      success: true,
      data: {
        hasHistory: true,
        analyzedCount: totalQuestionsAnalyzed,
        strongCount,
        attentionCount,
        concepts,
      },
    });
  } catch (err) {
    console.error("[Analytics] Error in getConceptRootAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to calculate ConceptRoot analytics." });
  }
}

// ─────────────────────────────────────────────
// HELPER: Generate personalized roadmap stages from real assessment data
// ─────────────────────────────────────────────
export async function generatePersonalizedRoadmap(userId, customTargetCareer = null) {
  const user = await User.findById(userId).lean();
  const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
  const existingRoadmap = await UserRoadmap.findOne({ userId }).lean();

  const selectedField = user?.selectedField || user?.onboardingProfile?.field || "Technology";
  const targetCareer = customTargetCareer || existingRoadmap?.targetCareer || user?.onboardingProfile?.careerGoal || selectedField;

  const academic = getAcademicCurriculum(targetCareer, selectedField);

  if (!attempts || attempts.length === 0) {
    let stages = [];
    if (academic.isAcademic) {
      stages = [
        {
          id: 1,
          title: academic.phase1.title,
          phase: academic.phase1.phase,
          status: "current",
          duration: "4 Weeks",
          priority: "High",
          why: `Master baseline NCERT textbook definitions, historical timelines, and exercise questions for ${academic.subjectName}.`,
          progress: 0,
          concepts: academic.phase1.topics,
          description: academic.phase1.description,
          learningTasks: academic.phase1.tasks,
          practiceTasks: ["Read NCERT chapters", "Solve NCERT in-text questions"],
          questions: 20,
          isWeakConcept: false,
        },
        {
          id: 2,
          title: academic.phase2.title,
          phase: academic.phase2.phase,
          status: "upcoming",
          duration: "6 Weeks",
          priority: "High",
          why: `Board exams heavily emphasize previous years' question patterns and require step-wise answer presentation.`,
          progress: 0,
          concepts: academic.phase2.topics,
          description: academic.phase2.description,
          learningTasks: academic.phase2.tasks,
          practiceTasks: ["Solve 5-10 Years Board PYQs", "Practice 3-mark & 5-mark long answers"],
          questions: 25,
          isWeakConcept: false,
        },
        {
          id: 3,
          title: academic.phase3.title,
          phase: academic.phase3.phase,
          status: "upcoming",
          duration: "6 Weeks",
          priority: "Standard",
          why: `Practice Assertion-Reason and Case-Based questions to eliminate conceptual gaps and improve precision.`,
          progress: 0,
          concepts: academic.phase3.topics,
          description: academic.phase3.description,
          learningTasks: academic.phase3.tasks,
          practiceTasks: ["Solve 30+ Assertion-Reason questions", "Practice map pointing drills"],
          questions: 30,
          isWeakConcept: false,
        },
        {
          id: 4,
          title: academic.phase4.title,
          phase: academic.phase4.phase,
          status: "locked",
          duration: "8 Weeks",
          priority: "High",
          why: `Simulate full 3-hour Board Exam conditions using latest CBSE Sample Papers.`,
          progress: 0,
          concepts: academic.phase4.topics,
          description: academic.phase4.description,
          learningTasks: academic.phase4.tasks,
          practiceTasks: ["Solve 3 full-length 3-hour Board Mock Papers", "Master time allocation"],
          questions: 25,
          isWeakConcept: false,
        }
      ];
    } else {
      const requiredRoleSkills = getRequiredSkillsForRole(targetCareer);
      stages = [
        {
          id: 1,
          title: `Phase 1: ${cleanTopicName(targetCareer)} Foundations`,
          phase: "Foundations (0-25% Readiness)",
          status: "current",
          duration: "4 Weeks",
          priority: "High",
          why: `Master baseline concepts, terminology, and core prerequisites for ${targetCareer}.`,
          progress: 0,
          concepts: [cleanTopicName(requiredRoleSkills[0] || "Foundations"), cleanTopicName(requiredRoleSkills[1] || "Core Theory")],
          description: `Begin your journey into ${targetCareer} by understanding foundational core principles.`,
          learningTasks: [
            `Study official documentation and fundamentals for ${cleanTopicName(requiredRoleSkills[0] || targetCareer)}`,
            `Build structured notes and cheatsheets for key syntax and concepts`,
            `Solve basic practice exercises to test understanding`
          ],
          practiceTasks: ["Complete foundational exercises", "Pass concept check assessment"],
          questions: 20,
          isWeakConcept: false,
        },
        {
          id: 2,
          title: `Phase 2: Core Competencies & Architecture`,
          phase: "Core Competency (25-50% Readiness)",
          status: "upcoming",
          duration: "6 Weeks",
          priority: "Medium",
          why: `Build hands-on competencies in essential ${targetCareer} topics.`,
          progress: 0,
          concepts: requiredRoleSkills.slice(0, 3).map(cleanTopicName),
          description: `Build hands-on competencies in essential ${targetCareer} topics.`,
          learningTasks: [
            `Implement real-world modules using ${cleanTopicName(requiredRoleSkills[1] || "core tools")}`,
            `Learn industry patterns and architectural best practices`,
            `Practice writing clean, tested, and maintainable code`
          ],
          practiceTasks: ["Build hands-on feature modules", "Review design patterns"],
          questions: 25,
          isWeakConcept: false,
        },
        {
          id: 3,
          title: `Phase 3: Applied Execution & Optimization`,
          phase: "Advanced Specialization (50-75% Readiness)",
          status: "upcoming",
          duration: "6 Weeks",
          priority: "Standard",
          why: `Practice applied execution in ${targetCareer} scenarios.`,
          progress: 0,
          concepts: requiredRoleSkills.slice(2, 4).map(cleanTopicName),
          description: `Practice the concepts in practical scenarios.`,
          learningTasks: [
            `Optimize system performance and debug edge cases`,
            `Integrate external APIs, state management, and persistence`,
            `Solve medium-to-hard domain challenges`
          ],
          practiceTasks: ["Complete scenario-based tasks", "Conduct code refactoring"],
          questions: 30,
          isWeakConcept: false,
        },
        {
          id: 4,
          title: `Phase 4: Production Readiness & Portfolio`,
          phase: "Career Readiness (75-100% Job Ready)",
          status: "locked",
          duration: "8 Weeks",
          priority: "Standard",
          why: `Advance through the remaining ${targetCareer} skills.`,
          progress: 0,
          concepts: requiredRoleSkills.slice(3, 5).map(cleanTopicName),
          description: `Advance through the remaining ${targetCareer} skills.`,
          learningTasks: [
            `Deploy full-stack production build with automated tests`,
            `Document system architecture and design decisions`,
            `Prepare for technical deep-dives and mock interviews`
          ],
          practiceTasks: ["Finalize portfolio project", "Complete mock assessment"],
          questions: 25,
          isWeakConcept: false,
        }
      ];
    }

    const roadmapData = {
      hasHistory: false,
      userId,
      targetCareer,
      selectedField,
      readinessScore: 0,
      completedStageIds: [],
      stages: stages,
      lastEvaluatedAt: new Date(),
    };
    
    await UserRoadmap.findOneAndUpdate({ userId }, roadmapData, { upsert: true, new: true });
    return roadmapData;
  }

  const totalAttempts = attempts.length;
  const overallAvgScore = Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts);

  // Group performance by category/topic
  const catMap = {};
  const conceptMap = {};
  let totalMistakes = 0;
  let totalCorrect = 0;
  attempts.forEach((a) => {
    const cat = a.assessmentCategory || "General";
    if (!catMap[cat]) {
      catMap[cat] = { sum: 0, count: 0, totalQuestions: 0, incorrect: 0, sampleExplanations: [] };
    }
    catMap[cat].sum += a.scorePercent;
    catMap[cat].count++;
    catMap[cat].totalQuestions += a.totalQuestions || 0;
    catMap[cat].incorrect += a.incorrectCount || 0;
    totalMistakes += a.incorrectCount || 0;
    totalCorrect += a.correctCount || 0;

    if (Array.isArray(a.questionResults)) {
      a.questionResults.forEach((q) => {
        const concept = String(q.concept || cat).trim() || cat;
        if (!conceptMap[concept]) {
          conceptMap[concept] = { correct: 0, incorrect: 0, total: 0, explanations: [] };
        }
        conceptMap[concept].total += 1;
        if (q.isCorrect || q.status === "correct") {
          conceptMap[concept].correct += 1;
        } else {
          conceptMap[concept].incorrect += 1;
        }
        if (!q.isCorrect && q.explanation && catMap[cat].sampleExplanations.length < 3) {
          catMap[cat].sampleExplanations.push(q.explanation);
        }
        if (!q.isCorrect && q.explanation && conceptMap[concept].explanations.length < 2) {
          conceptMap[concept].explanations.push(q.explanation);
        }
      });
    }
  });

  const categoryStats = Object.entries(catMap).map(([category, data]) => ({
    category: cleanTopicName(category),
    avgScore: Math.round(data.sum / data.count),
    count: data.count,
    incorrect: data.incorrect,
    sampleExplanations: data.sampleExplanations,
  }));

  // Prefer the real per-question concept data when available. Older attempts
  // without concept metadata safely fall back to their assessment category.
  const conceptStats = Object.entries(conceptMap).map(([concept, data]) => ({
    category: cleanTopicName(concept),
    avgScore: Math.round((data.correct / Math.max(data.total, 1)) * 100),
    count: data.total,
    incorrect: data.incorrect,
    sampleExplanations: data.explanations,
  }));
  const learningStats = conceptStats.length > 0 ? conceptStats : categoryStats;

  // Identify weak concepts (accuracy < 70% or incorrect > 0)
  const weakConcepts = learningStats.filter((c) => c.avgScore < 70 || c.incorrect > 0).sort((a, b) => a.avgScore - b.avgScore);
  const strongConcepts = learningStats.filter((c) => c.avgScore >= 75);

  const completedSet = new Set(existingRoadmap?.completedStageIds || []);

  let stages = [];

  if (academic.isAcademic) {
    const weakList = weakConcepts.map((w) => cleanTopicName(w.category)).filter(Boolean);
    const topWeak = weakList[0] || "NCERT Textbook Units";

    let stage1Status = completedSet.has(1) ? "completed" : "current";
    let stage2Status = completedSet.has(2) ? "completed" : (stage1Status === "completed" ? "current" : "upcoming");
    let stage3Status = completedSet.has(3) ? "completed" : (stage2Status === "completed" ? "current" : "upcoming");
    let stage4Status = completedSet.has(4) ? "completed" : (stage3Status === "completed" ? "current" : (overallAvgScore >= 80 ? "upcoming" : "locked"));

    stages = [
      {
        id: 1,
        title: academic.phase1.title,
        phase: academic.phase1.phase,
        status: stage1Status,
        duration: "4 Weeks",
        priority: "High",
        why: weakList.length > 0
          ? `Your assessment shows need for improvement in ${topWeak}. Build solid textbook fundamentals first.`
          : `Master baseline NCERT textbook definitions, historical timelines, and exercise questions for ${academic.subjectName}.`,
        progress: stage1Status === "completed" ? 100 : Math.min(90, Math.max(25, overallAvgScore)),
        concepts: academic.phase1.topics,
        description: weakList.length > 0
          ? `Master core NCERT textbook concepts, chapter definitions, and exercise questions, with special focus on ${topWeak}.`
          : academic.phase1.description,
        learningTasks: academic.phase1.tasks,
        practiceTasks: ["Solve all NCERT chapter exercises", "Practice 20+ concept-based MCQs"],
        questions: 20,
        isWeakConcept: weakList.length > 0,
      },
      {
        id: 2,
        title: academic.phase2.title,
        phase: academic.phase2.phase,
        status: stage2Status,
        duration: "6 Weeks",
        priority: "High",
        why: `Board exams heavily repeat previous years' question patterns (PYQs) and require step-wise answer presentation.`,
        progress: stage2Status === "completed" ? 100 : stage2Status === "current" ? 45 : 0,
        concepts: academic.phase2.topics,
        description: academic.phase2.description,
        learningTasks: academic.phase2.tasks,
        practiceTasks: ["Solve 5-10 Years Board PYQs", "Practice 3-mark & 5-mark structured answers"],
        questions: 25,
        isWeakConcept: false,
      },
      {
        id: 3,
        title: academic.phase3.title,
        phase: academic.phase3.phase,
        status: stage3Status,
        duration: "6 Weeks",
        priority: "Medium",
        why: totalMistakes > 0
          ? `Analysis shows ${totalMistakes} missed question(s). Practice is targeted at resolving recurring mistake patterns and mastering Assertion-Reason questions.`
          : `Challenge yourself with tricky Assertion-Reason and Case-Based questions to push for a 95%+ score.`,
        progress: stage3Status === "completed" ? 100 : stage3Status === "current" ? 30 : 0,
        concepts: academic.phase3.topics,
        description: academic.phase3.description,
        learningTasks: academic.phase3.tasks,
        practiceTasks: ["Solve 30+ Assertion-Reason questions", "Re-attempt missed assessment questions"],
        questions: 30,
        isWeakConcept: false,
      },
      {
        id: 4,
        title: academic.phase4.title,
        phase: academic.phase4.phase,
        status: stage4Status,
        duration: "8 Weeks",
        priority: "High",
        why: `Simulate full 3-hour Board Exam conditions using latest CBSE Sample Papers with model answer sheet presentation.`,
        progress: stage4Status === "completed" ? 100 : stage4Status === "current" ? 20 : 0,
        concepts: academic.phase4.topics,
        description: academic.phase4.description,
        learningTasks: academic.phase4.tasks,
        practiceTasks: ["Solve 3 full-length 3-hour Board Mock Papers", "Master time allocation"],
        questions: 25,
        isWeakConcept: false,
      }
    ];
  } else {
    // Determine stage 1 (Foundations & Weak Concepts)
    const phase1Concepts = [];
    let phase1Why = "";
    let phase1Priority = "Standard";
    let phase1Status = "current";

    if (weakConcepts.length > 0) {
      weakConcepts.forEach((wc) => phase1Concepts.push(cleanTopicName(wc.category)));
      const topWeak = weakConcepts[0];
      phase1Priority = "High";
      phase1Why = `Your assessment history contains ${totalCorrect} correct and ${totalMistakes} incorrect answers. Accuracy in ${cleanTopicName(topWeak.category)} is ${topWeak.avgScore}% with ${topWeak.incorrect} missed question(s), so this is your highest-priority learning need.`;
    } else if (overallAvgScore >= 75) {
      phase1Concepts.push("Programming Fundamentals", "Data Structures Basics", "Core Theory & Best Practices");
      phase1Why = `Demonstrated strong baseline score of ${overallAvgScore}%. Foundational prerequisites are fully mastered.`;
      phase1Status = "completed";
    } else {
      phase1Concepts.push("Foundational Theory", "Core Domain Concepts", "Environment & Tools Setup");
      phase1Why = `Current assessment score is ${overallAvgScore}%. Master basic fundamentals to solidify core prerequisites.`;
    }

    // Ensure unique concepts in Phase 1
    const uniquePhase1Concepts = [...new Set(phase1Concepts)];

    // Stage 2: Core Concepts & SkillGap Alignment
    const phase2Concepts = [];
    const requiredRoleSkills = getRequiredSkillsForRole(targetCareer);
    requiredRoleSkills.forEach((skill) => {
      const cleaned = cleanTopicName(skill);
      if (!uniquePhase1Concepts.includes(cleaned)) {
        phase2Concepts.push(cleaned);
      }
    });
    if (phase2Concepts.length === 0) {
      phase2Concepts.push("System Architecture", "API Integration", "State Management & Optimization");
    }

    let phase2Priority = "Medium";
    let phase2Why = `SkillGap analysis indicates a ${100 - overallAvgScore}-point opportunity gap for ${targetCareer}. Focus on building core professional competencies in these areas.`;
    if (overallAvgScore < 60) {
      phase2Priority = "High";
    }

    // Stage 3: use the same missed-question data as MistakeMap and ConceptRoot.
    const phase3Concepts = weakConcepts
      .sort((a, b) => b.incorrect - a.incorrect || a.avgScore - b.avgScore)
      .slice(0, 5)
      .map((concept) => `${cleanTopicName(concept.category)} Targeted Practice`);
    if (phase3Concepts.length === 0) {
      phase3Concepts.push(...strongConcepts.slice(0, 5).map((concept) => `${cleanTopicName(concept.category)} Applied Practice`));
    }
    const phase3Why = totalMistakes > 0
      ? `MistakeMap found ${totalMistakes} missed question(s), concentrated in ${weakConcepts.slice(0, 3).map((concept) => cleanTopicName(concept.category)).join(", ")}. Practice is ordered by those recurring error patterns.`
      : `Your completed questions show no recurring mistakes. Use applied practice in your strongest concepts to maintain and extend performance.`;

    // Stage 4: advanced work is chosen from demonstrated strengths and remaining skill gap
    const phase4Concepts = [...new Set([
      ...strongConcepts.map((concept) => `${cleanTopicName(concept.category)} Advanced Applications`),
      ...requiredRoleSkills.map(cleanTopicName).filter((skill) => !uniquePhase1Concepts.includes(skill)),
    ])].slice(0, 5);
    if (phase4Concepts.length === 0) {
      phase4Concepts.push(...phase2Concepts.slice(0, 5));
    }
    const phase4Why = overallAvgScore >= 75
      ? `Your ${overallAvgScore}% assessment average supports advanced work in your strongest concepts and the remaining ${targetCareer} skill gap.`
      : `Advanced work unlocks after the foundation and practice phases address the concepts missed in your assessments.`;

    // Stage status determination
    let stage1Status = completedSet.has(1) ? "completed" : phase1Status;
    let stage2Status = completedSet.has(2) ? "completed" : (stage1Status === "completed" ? "current" : "upcoming");
    let stage3Status = completedSet.has(3) ? "completed" : (stage2Status === "completed" ? "current" : "upcoming");
    let stage4Status = completedSet.has(4) ? "completed" : (stage3Status === "completed" ? "current" : (overallAvgScore >= 80 ? "upcoming" : "locked"));

    stages = [
      {
        id: 1,
        title: `Phase 1: ${weakConcepts.length > 0 ? "Foundations & Weak Concept Remediation" : "Core Foundations"}`,
        phase: "Foundations (0-25% Readiness)",
        status: stage1Status,
        duration: "4 Weeks",
        priority: phase1Priority,
        why: phase1Why,
        progress: stage1Status === "completed" ? 100 : Math.min(90, Math.max(15, overallAvgScore)),
        concepts: uniquePhase1Concepts.slice(0, 5),
        description: weakConcepts.length > 0
          ? `Remediate identified weak concepts (${weakConcepts.map((w) => cleanTopicName(w.category)).join(", ")}) and rebuild solid prerequisite knowledge.`
          : `Master baseline concepts, terminology, and core prerequisites for ${targetCareer}.`,
        learningTasks: [
          `Review core concepts and official documentation for ${uniquePhase1Concepts[0] || targetCareer}`,
          `Create revision cheat sheets and summarize key definitions`,
          `Solve 20+ foundation practice questions`
        ],
        practiceTasks: ["Complete foundational exercises", "Review missed baseline concepts"],
        questions: 20,
        isWeakConcept: weakConcepts.length > 0,
      },
      {
        id: 2,
        title: `Phase 2: Core Competencies & Skill Gap Alignment`,
        phase: "Core Competency (25-50% Readiness)",
        status: stage2Status,
        duration: "6 Weeks",
        priority: phase2Priority,
        why: phase2Why,
        progress: stage2Status === "completed" ? 100 : stage2Status === "current" ? 45 : 0,
        concepts: phase2Concepts.slice(0, 5),
        description: `Build hands-on competencies in essential ${targetCareer} topics aligned with your SkillGap evaluation.`,
        learningTasks: [
          `Build practical implementations for ${phase2Concepts[0] || "core modules"}`,
          `Learn industry standard patterns and architecture`,
          `Practice 25+ intermediate domain questions`
        ],
        practiceTasks: ["Implement practical features", "Solve intermediate questions"],
        questions: 25,
        isWeakConcept: false,
      },
      {
        id: 3,
        title: `Phase 3: Applied Execution & Mistake Pattern Resolution`,
        phase: "Advanced Specialization (50-75% Readiness)",
        status: stage3Status,
        duration: "6 Weeks",
        priority: "Standard",
        why: phase3Why,
        progress: stage3Status === "completed" ? 100 : stage3Status === "current" ? 30 : 0,
        concepts: phase3Concepts,
        description: `Practice the concepts flagged by your MistakeMap and ConceptRoot analysis until their error patterns stop recurring.`,
        learningTasks: [
          `Analyze root causes of missed questions from recent assessments`,
          `Practice targeted problem-solving in weak topic areas`,
          `Re-attempt tricky questions until 100% mastery`
        ],
        practiceTasks: ["Targeted question sets", "Mistake pattern drills"],
        questions: 30,
        isWeakConcept: false,
      },
      {
        id: 4,
        title: `Phase 4: Advanced Skills & Readiness Portfolio`,
        phase: "Career Readiness (75-100% Ready)",
        status: stage4Status,
        duration: "8 Weeks",
        priority: overallAvgScore >= 80 ? "High" : "Standard",
        why: phase4Why,
        progress: stage4Status === "completed" ? 100 : stage4Status === "current" ? 20 : 0,
        concepts: phase4Concepts,
        description: `Advance through the remaining ${targetCareer} skills selected from your measured strengths and skill gaps.`,
        learningTasks: [
          `Complete end-to-end advanced case studies or projects`,
          `Simulate real-world domain challenges under timed constraints`,
          `Review performance against industry benchmarks`
        ],
        practiceTasks: ["Complete capstone evaluation", "Comprehensive final assessment"],
        questions: 25,
        isWeakConcept: false,
      },
    ];
  }

  // Compute readiness score
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const readinessScore = Math.min(100, Math.max(overallAvgScore, Math.round((completedCount / 4) * 100)));

  // Save or update UserRoadmap in MongoDB
  const roadmapData = {
    userId,
    targetCareer,
    selectedField,
    readinessScore,
    hasHistory: true,
    completedStageIds: Array.from(completedSet),
    stages,
    lastEvaluatedAt: new Date(),
  };

  await UserRoadmap.findOneAndUpdate(
    { userId },
    roadmapData,
    { upsert: true, new: true }
  );

  return roadmapData;
}

// ─────────────────────────────────────────────
// 4. GET /api/analytics/roadmap
// ─────────────────────────────────────────────
export async function getRoadmapAnalytics(req, res) {
  try {
    const userId = req.user._id;

    // Generate or update roadmap using real user assessment results
    const roadmap = await generatePersonalizedRoadmap(userId);

    return res.json({
      success: true,
      data: roadmap,
    });
  } catch (err) {
    console.error("[Analytics] Error in getRoadmapAnalytics:", err);
    return res.status(500).json({ success: false, message: "Failed to generate dynamic personalized roadmap." });
  }
}

// ─────────────────────────────────────────────
// 5. PUT /api/analytics/roadmap
// Persists user modifications (e.g. stage completion toggle, target career goal)
// ─────────────────────────────────────────────
export async function updateUserRoadmap(req, res) {
  try {
    const userId = req.user._id;
    const { stageId, customCareer, completedStageIds } = req.body;

    let userRoadmap = await UserRoadmap.findOne({ userId });

    let updatedCompletedIds = userRoadmap?.completedStageIds ? [...userRoadmap.completedStageIds] : [];

    if (Array.isArray(completedStageIds)) {
      updatedCompletedIds = completedStageIds;
    } else if (stageId != null) {
      const idx = updatedCompletedIds.indexOf(Number(stageId));
      if (idx >= 0) {
        updatedCompletedIds.splice(idx, 1);
      } else {
        updatedCompletedIds.push(Number(stageId));
      }
    }

    if (!userRoadmap) {
      userRoadmap = await UserRoadmap.create({
        userId,
        targetCareer: customCareer || "Full-Stack Software Engineer",
        completedStageIds: updatedCompletedIds,
      });
    } else {
      if (customCareer) userRoadmap.targetCareer = customCareer;
      userRoadmap.completedStageIds = updatedCompletedIds;
      await userRoadmap.save();
    }

    // Regenerate roadmap using updated parameters
    const updatedRoadmap = await generatePersonalizedRoadmap(userId, customCareer || userRoadmap.targetCareer);

    return res.json({
      success: true,
      data: updatedRoadmap,
    });
  } catch (err) {
    console.error("[Analytics] Error in updateUserRoadmap:", err);
    return res.status(500).json({ success: false, message: "Failed to update roadmap." });
  }
}

// ─────────────────────────────────────────────
// 6. GET /api/analytics/project-ideas
// Fetches personalized project ideas via AI based on target career and topic
// ─────────────────────────────────────────────
export async function getProjectIdeas(req, res) {
  try {
    const { topic, field } = req.query;
    
    // Check if topic and field exist, default to something if not.
    const requestedTopic = topic || "General Concepts";
    const requestedField = field || "General Field";

    // Call AI to generate project ideas
    const aiResponse = await generateProjectIdeasWithAI(requestedTopic, requestedField);

    return res.json({
      success: true,
      data: aiResponse,
    });
  } catch (err) {
    console.error("[Analytics] Error in getProjectIdeas:", err);
    return res.status(500).json({ success: false, message: "Failed to generate project ideas." });
  }
}
