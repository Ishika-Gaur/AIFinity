import { readCachedStudentUser } from "./studentAuthStorage";

export const FIELDS = [
  "Software Development",
  "Data Science & Analytics",
  "Web Development",
  "Mobile App Development",
  "AI & Machine Learning",
  "Cybersecurity",
  "Cloud Computing & DevOps",
  "Graphic Design & UI/UX",
  "Digital Marketing",
  "Business & Management",
  "Finance & Accounting",
  "Mechanical Engineering",
  "Electrical & Electronics",
  "Civil Engineering",
  "Medicine & Healthcare",
  "Law & Legal Studies",
  "Psychology & Counseling",
  "Education & Teaching",
  "Media & Communication",
  "Architecture & Interior Design",
  "Biotechnology & Life Sciences",
  "Environmental Science",
  "Music & Performing Arts",
  "Fashion & Textile Design",
  "Hospitality & Tourism",
  "Agriculture & Food Science",
  "Physics & Mathematics",
  "Commerce & Economics",
  "Political Science & Public Policy",
  "Pharmacy & Pharmaceutical Sciences",
];
export const CAREER_GOALS_BY_FIELD = {
  "Software Development": [
    "Full Stack Developer", "Backend Developer", "Frontend Developer",
    "Software Architect", "DevOps Engineer", "QA/Test Engineer",
  ],
  "Data Science & Analytics": [
    "Data Scientist", "Data Analyst", "Business Intelligence Analyst",
    "Data Engineer", "Statistician",
  ],
  "Web Development": [
    "Full Stack Web Developer", "Frontend Engineer", "WordPress Developer",
    "Web Designer", "Jamstack Developer",
  ],
  "Mobile App Development": [
    "iOS Developer", "Android Developer", "Flutter Developer",
    "React Native Developer", "Mobile Architect",
  ],
  "AI & Machine Learning": [
    "ML Engineer", "AI Researcher", "NLP Engineer",
    "Computer Vision Engineer", "Deep Learning Specialist",
  ],
  "Cybersecurity": [
    "Security Analyst", "Penetration Tester", "Security Architect",
    "SOC Analyst", "Cybersecurity Consultant",
  ],
  "Cloud Computing & DevOps": [
    "Cloud Architect", "DevOps Engineer", "Site Reliability Engineer",
    "Cloud Security Engineer", "Platform Engineer",
  ],
  "Graphic Design & UI/UX": [
    "UI/UX Designer", "Graphic Designer", "Product Designer",
    "Motion Graphics Designer", "Brand Identity Designer",
  ],
  "Digital Marketing": [
    "SEO Specialist", "Social Media Manager", "Content Marketing Manager",
    "Performance Marketer", "Growth Hacker",
  ],
  "Business & Management": [
    "Business Analyst", "Product Manager", "Operations Manager",
    "Strategy Consultant", "Entrepreneur",
  ],
  "Finance & Accounting": [
    "Financial Analyst", "Chartered Accountant", "Investment Banker",
    "Tax Consultant", "Risk Manager",
  ],
  "Mechanical Engineering": [
    "Mechanical Design Engineer", "Automotive Engineer", "HVAC Engineer",
    "Manufacturing Engineer", "Robotics Engineer",
  ],
  "Electrical & Electronics": [
    "Embedded Systems Engineer", "VLSI Design Engineer", "Power Systems Engineer",
    "IoT Developer", "Electrical Design Engineer",
  ],
  "Civil Engineering": [
    "Structural Engineer", "Construction Manager", "Urban Planner",
    "Transportation Engineer", "Geotechnical Engineer",
  ],
  "Medicine & Healthcare": [
    "Doctor / Physician", "Surgeon", "Nurse Practitioner",
    "Medical Researcher", "Public Health Specialist",
  ],
  "Law & Legal Studies": [
    "Corporate Lawyer", "Criminal Lawyer", "Legal Advisor",
    "Civil Rights Advocate", "Judiciary / Judge",
  ],
  "Psychology & Counseling": [
    "Clinical Psychologist", "Counseling Psychologist", "Organizational Psychologist",
    "School Counselor", "Behavioral Therapist",
  ],
  "Education & Teaching": [
    "School Teacher", "College Professor", "Curriculum Designer",
    "Education Consultant", "EdTech Specialist",
  ],
  "Media & Communication": [
    "Journalist", "Content Creator", "Public Relations Specialist",
    "Film Director", "Radio/TV Broadcaster",
  ],
  "Architecture & Interior Design": [
    "Architect", "Interior Designer", "Landscape Architect",
    "Urban Designer", "Sustainable Design Consultant",
  ],
  "Biotechnology & Life Sciences": [
    "Biotech Researcher", "Bioinformatician", "Genetic Engineer",
    "Lab Scientist", "Pharmaceutical Researcher",
  ],
  "Environmental Science": [
    "Environmental Consultant", "Ecologist", "Sustainability Analyst",
    "Climate Scientist", "Wildlife Biologist",
  ],
  "Music & Performing Arts": [
    "Music Composer", "Singer / Vocalist", "Music Producer",
    "Theatre Director", "Dance Choreographer",
  ],
  "Fashion & Textile Design": [
    "Fashion Designer", "Textile Engineer", "Merchandiser",
    "Stylist", "Fashion Illustrator",
  ],
  "Hospitality & Tourism": [
    "Hotel Manager", "Event Planner", "Travel Consultant",
    "Food & Beverage Manager", "Tourism Officer",
  ],
  "Agriculture & Food Science": [
    "Agronomist", "Food Technologist", "Agricultural Engineer",
    "Horticulturist", "Dairy Technologist",
  ],
  "Physics & Mathematics": [
    "Research Scientist", "Quantitative Analyst", "Astrophysicist",
    "Applied Mathematician", "Physics Professor",
  ],
  "Commerce & Economics": [
    "Economist", "Trade Analyst", "Market Researcher",
    "Banking Officer", "Supply Chain Manager",
  ],
  "Political Science & Public Policy": [
    "Policy Analyst", "Civil Services Officer", "Diplomat",
    "Political Consultant", "Social Worker",
  ],
  "Pharmacy & Pharmaceutical Sciences": [
    "Pharmacist", "Drug Safety Associate", "Clinical Research Associate",
    "Pharmaceutical Sales", "Regulatory Affairs Specialist",
  ],
};
export const FIELD_ICONS = {
  "Software Development": "</>",
  "Data Science & Analytics": "📊",
  "Web Development": "🌐",
  "Mobile App Development": "📱",
  "AI & Machine Learning": "🤖",
  "Cybersecurity": "🔒",
  "Cloud Computing & DevOps": "☁️",
  "Graphic Design & UI/UX": "🎨",
  "Digital Marketing": "📣",
  "Business & Management": "💼",
  "Finance & Accounting": "💰",
  "Mechanical Engineering": "⚙️",
  "Electrical & Electronics": "⚡",
  "Civil Engineering": "🏗️",
  "Medicine & Healthcare": "🩺",
  "Law & Legal Studies": "⚖️",
  "Psychology & Counseling": "🧠",
  "Education & Teaching": "📚",
  "Media & Communication": "🎬",
  "Architecture & Interior Design": "🏛️",
  "Biotechnology & Life Sciences": "🧬",
  "Environmental Science": "🌿",
  "Music & Performing Arts": "🎵",
  "Fashion & Textile Design": "👗",
  "Hospitality & Tourism": "🏨",
  "Agriculture & Food Science": "🌾",
  "Physics & Mathematics": "🔬",
  "Commerce & Economics": "📈",
  "Political Science & Public Policy": "🏛",
  "Pharmacy & Pharmaceutical Sciences": "💊",
};
export const CATEGORIES = [
  "All",
  "Programming & DSA",
  "DSA",
  "Programming Fundamentals",
  "Problem Solving",
  "Web Development",
  "Data Analysis",
  "SQL",
  "Design",
  "Marketing",
  "Business",
  "Engineering"
];
export const TYPE_FILTERS = [
  "All",
  "mcq",
  "problem-solving",
  "coding",
  "conceptual",
  "scenario",
  "logical-reasoning",
  "data-interpretation"
];
export const DIFFICULTY_FILTERS = [
  "All",
  "Easy",
  "Medium",
  "Hard"
];
export const QUESTION_TYPES = [
  "mcq",
  "problem-solving",
  "coding",
  "conceptual",
  "scenario",
  "logical-reasoning",
  "data-interpretation",
  "output"
];
export const GRADABLE_TYPES = [
  "mcq",
  "scenario",
  "logical-reasoning",
  "data-interpretation",
  "output"
];

const ONBOARDING_STORAGE_KEY = "aifinity_onboarding_profile";

const DEFAULT_PROFILE = {
  careerGoal: "Software Developer",
  field: "Software Development",
  skills: ["DSA", "JavaScript", "React"],
  currentLevel: "Intermediate",
};

const FIELD_KEYWORDS = {
  "Software Development": [
    "software", "developer", "programming", "code", "coding",
    "web dev", "app dev", "dsa", "javascript", "react", "computer science",
  ],
  "Data Analysis": ["data", "analyst", "analytics", "sql", "statistics", "data science"],
  "Graphic Design": ["design", "graphic", "ui", "ux", "visual", "illustrator", "photoshop"],
  "Digital Marketing": ["marketing", "seo", "social media", "content", "campaign"],
  "Business / Management": ["business", "management", "manager", "mba", "entrepreneur", "finance"],
  Engineering: ["engineer", "engineering", "mechanical", "civil", "electrical", "core branch"],
};

function matchField(text) {
  const lower = (text || "").toLowerCase().trim();
  if (!lower) return null;
  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return field;
  }
  return null;
}

export function getUserProfile() {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_PROFILE;
  try {
    const sessionUser = readCachedStudentUser();

    if (sessionUser && sessionUser.selectedField) {
      const profile = sessionUser.onboardingProfile || {};
      return {
        careerGoal: profile.careerGoal || sessionUser.selectedField,
        field: sessionUser.selectedField,
        skills: DEFAULT_PROFILE.skills,
        currentLevel: profile.level || DEFAULT_PROFILE.currentLevel,
      };
    }

    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const saved = JSON.parse(raw);

    if (saved.field && saved.careerGoal) {
      return {
        careerGoal: saved.careerGoal,
        field: saved.field,
        skills: DEFAULT_PROFILE.skills,
        currentLevel: saved.level || DEFAULT_PROFILE.currentLevel,
      };
    }

    const field =
      matchField(saved.customInput) || matchField(saved.interest) || DEFAULT_PROFILE.field;
    const careerGoal = saved.customInput || saved.goal || saved.interest || DEFAULT_PROFILE.careerGoal;
    return {
      careerGoal,
      field,
      skills: saved.customInput ? [saved.customInput] : DEFAULT_PROFILE.skills,
      currentLevel: saved.level || DEFAULT_PROFILE.currentLevel,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function formatType(type) {
  return type
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
