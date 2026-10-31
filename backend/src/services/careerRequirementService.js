/**
 * careerRequirementService.js
 * Static knowledge base for career requirements and alias mappings.
 * Maps common career goals to a structured set of required skills, importances, and prerequisites.
 */

export const CAREER_KNOWLEDGE_BASE = {
  "software engineer": {
    role: "Software Engineer",
    skills: [
      { id: "cs.programming", name: "Programming Fundamentals", importance: 0.95, prerequisites: [] },
      { id: "dsa.arrays", name: "Arrays", importance: 0.90, prerequisites: ["cs.programming"] },
      { id: "dsa.searching", name: "Searching Algorithms", importance: 0.85, prerequisites: ["dsa.arrays"] },
      { id: "dsa.binary-search", name: "Binary Search", importance: 0.85, prerequisites: ["dsa.searching"] },
      { id: "dsa.sorting", name: "Sorting Algorithms", importance: 0.80, prerequisites: ["dsa.arrays"] },
      { id: "web.html_css", name: "HTML & CSS", importance: 0.70, prerequisites: [] },
      { id: "web.javascript", name: "JavaScript", importance: 0.90, prerequisites: ["web.html_css", "cs.programming"] },
      { id: "db.sql", name: "SQL Databases", importance: 0.85, prerequisites: [] },
      { id: "backend.apis", name: "REST APIs", importance: 0.90, prerequisites: ["web.javascript", "db.sql"] },
      { id: "tools.git", name: "Version Control (Git)", importance: 0.95, prerequisites: [] }
    ]
  },
  "full stack developer": {
    role: "Full Stack Developer",
    skills: [
      { id: "web.html_css", name: "HTML & CSS", importance: 0.95, prerequisites: [] },
      { id: "web.javascript", name: "JavaScript Fundamentals", importance: 0.95, prerequisites: ["web.html_css"] },
      { id: "web.react", name: "React JS", importance: 0.90, prerequisites: ["web.javascript"] },
      { id: "web.react_state", name: "React State Management", importance: 0.85, prerequisites: ["web.react"] },
      { id: "backend.node", name: "Node.js", importance: 0.90, prerequisites: ["web.javascript"] },
      { id: "backend.apis", name: "REST APIs", importance: 0.90, prerequisites: ["backend.node"] },
      { id: "db.nosql", name: "NoSQL Databases (MongoDB)", importance: 0.80, prerequisites: ["backend.apis"] },
      { id: "db.sql", name: "SQL Databases", importance: 0.85, prerequisites: ["backend.apis"] },
      { id: "tools.git", name: "Version Control (Git)", importance: 0.95, prerequisites: [] },
      { id: "devops.deployment", name: "Deployment", importance: 0.80, prerequisites: ["backend.apis", "web.react", "tools.git"] }
    ]
  },
  "data scientist": {
    role: "Data Scientist",
    skills: [
      { id: "cs.python", name: "Python Programming", importance: 0.95, prerequisites: [] },
      { id: "math.statistics", name: "Statistics & Probability", importance: 0.95, prerequisites: [] },
      { id: "data.pandas", name: "Data Manipulation (Pandas)", importance: 0.90, prerequisites: ["cs.python"] },
      { id: "data.visualization", name: "Data Visualization", importance: 0.85, prerequisites: ["data.pandas"] },
      { id: "db.sql", name: "SQL", importance: 0.90, prerequisites: [] },
      { id: "ml.fundamentals", name: "Machine Learning Fundamentals", importance: 0.95, prerequisites: ["cs.python", "math.statistics"] },
      { id: "ml.scikit", name: "Scikit-Learn", importance: 0.90, prerequisites: ["ml.fundamentals", "data.pandas"] }
    ]
  }
};

export const CAREER_ALIASES = {
  "software developer": "software engineer",
  "software development": "software engineer",
  "software dev": "software engineer",
  "software engineering": "software engineer",
  "developer": "software engineer",
  "programmer": "software engineer",
  "swe": "software engineer",
  "sde": "software engineer",
  "web developer": "full stack developer",
  "frontend developer": "full stack developer",
  "backend developer": "full stack developer",
  "full stack": "full stack developer",
  "fullstack developer": "full stack developer",
  "data analyst": "data scientist",
  "machine learning engineer": "data scientist",
  "ai engineer": "data scientist",
  "data science": "data scientist",
};

export const getCareerRequirements = async (careerGoal) => {
  let goalKey = (careerGoal || "").toLowerCase().trim();
  
  // Check direct alias mapping
  if (CAREER_ALIASES[goalKey]) {
    goalKey = CAREER_ALIASES[goalKey];
  }

  // Try to find a direct match in knowledge base
  if (CAREER_KNOWLEDGE_BASE[goalKey]) {
    return CAREER_KNOWLEDGE_BASE[goalKey];
  }

  // Fallback to substring matching on aliases
  for (const [alias, canonical] of Object.entries(CAREER_ALIASES)) {
    if (goalKey.includes(alias) || alias.includes(goalKey)) {
      if (CAREER_KNOWLEDGE_BASE[canonical]) {
        return CAREER_KNOWLEDGE_BASE[canonical];
      }
    }
  }

  // Fallback to searching for keywords in canonical keys
  for (const [key, data] of Object.entries(CAREER_KNOWLEDGE_BASE)) {
    if (goalKey.includes(key) || key.includes(goalKey)) {
      return data;
    }
  }

  // Default fallback if no match is found
  return {
    role: careerGoal || "Custom Goal",
    skills: []
  };
};
