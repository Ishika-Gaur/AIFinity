/**
 * careerRequirementService.js
 * V1 Static knowledge base for career requirements.
 * Maps common career goals to a structured set of required skills, importances, and prerequisites.
 */

const CAREER_KNOWLEDGE_BASE = {
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

export const getCareerRequirements = async (careerGoal) => {
  const goalKey = (careerGoal || "").toLowerCase().trim();
  
  // Try to find a direct match
  if (CAREER_KNOWLEDGE_BASE[goalKey]) {
    return CAREER_KNOWLEDGE_BASE[goalKey];
  }

  // Fallback to searching for keywords
  for (const [key, data] of Object.entries(CAREER_KNOWLEDGE_BASE)) {
    if (goalKey.includes(key) || key.includes(goalKey)) {
      return data;
    }
  }

  // Default fallback
  return CAREER_KNOWLEDGE_BASE["software engineer"];
};
