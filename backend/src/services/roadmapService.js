import AttemptResult from "../models/AttemptResult.js";
import ConceptRootAnalysis from "../models/ConceptRootAnalysis.js";
import SkillGapAnalysis from "../models/SkillGapAnalysis.js";
import UserRoadmap from "../models/UserRoadmap.js";

import { getCareerRequirements } from "./careerRequirementService.js";
import { calculateSkillPriorities } from "./prioritizationService.js";
import { orderSkillsByDependency } from "./dependencyService.js";
import { validateRoadmap } from "./roadmapValidator.js";
import { generatePersonalizedRoadmapWithAI } from "./geminiService.js";

async function buildStudentContext(userId, careerGoal) {
  const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
  const conceptRoots = await ConceptRootAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
  const skillGap = await SkillGapAnalysis.findOne({ userId }).sort({ createdAt: -1 }).lean();

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts) : 0;
  
  const mistakeMap = {};
  attempts.forEach(a => {
    (a.questionResults || []).forEach(q => {
      if (q.status === 'incorrect') {
        mistakeMap[q.concept] = (mistakeMap[q.concept] || 0) + 1;
      }
    });
  });

  return {
    careerGoal,
    currentLevel: `Average Score: ${avgScore}%`,
    skillGap: skillGap?.analysis || {},
    mistakeMap: {
      recurringMistakes: Object.entries(mistakeMap).sort((a,b)=>b[1]-a[1]).map(e => `${e[0]} (${e[1]} times)`).slice(0,10)
    },
    conceptRoot: conceptRoots.map(c => c.analysis),
    assessmentHistorySummary: attempts.slice(0, 10).map(a => `Assessed ${a.assessmentCategory}: ${a.scorePercent}%`),
    learningProgress: { completedAssessments: totalAttempts, avgScore }
  };
}

function generateDeterministicFallback(orderedSkills, careerGoal, studentContext) {
  console.log("[RoadmapService] Generating fallback roadmap...");
  return {
    roadmap: {
      title: "Fallback Basic Roadmap",
      career_goal: careerGoal,
      target_role: careerGoal,
      estimated_duration: "3 months",
      confidence: 0.5,
      phases: [
        {
          phase_id: "phase-1",
          title: "Core Requirements",
          objective: "Master the essential skills for your career goal.",
          priority: "HIGH",
          estimated_duration: "3 months",
          skills: orderedSkills.map((s, i) => ({
            skill_id: s.id || `skill-${i}`,
            name: s.name,
            status: "NOT_STARTED",
            priority: s.calculatedPriority || "MEDIUM",
            why: s.backendReason || "Required for career.",
            prerequisites: s.prerequisites || [],
            learning_tasks: ["Review basic concepts"],
            practice_tasks: ["Complete practice problems"],
            project_tasks: [],
            validation: ["Pass topic assessment"],
            estimated_hours: 5,
            dependencies: [],
            completion_criteria: ["Score 80%+ on assessment"]
          }))
        }
      ]
    },
    short_roadmap: {
      current_focus: orderedSkills[0]?.name || "Fundamentals",
      next_steps: orderedSkills.slice(0, 3).map(s => s.name),
      this_week: ["Start learning the fundamentals"],
      next_milestone: "Complete Phase 1"
    }
  };
}

export async function generateAndSaveRoadmap(user, careerGoal) {
  const attempts = await AttemptResult.find({ userId: user._id }).lean();
  if (attempts.length === 0) {
    throw new Error("Insufficient assessment data. Complete an assessment first.");
  }

  const studentContext = await buildStudentContext(user._id, careerGoal);
  
  // Deterministic prep
  const careerRequirements = await getCareerRequirements(careerGoal);
  const prioritizedSkills = calculateSkillPriorities(careerRequirements, studentContext);
  const orderedSkills = orderSkillsByDependency(prioritizedSkills);

  const fullContext = {
    ...studentContext,
    orderedSkills, // Pass the deterministically ordered skills to Gemini
    availableTime: user.onboardingProfile?.availableTime || "2 hours/day"
  };

  let finalAiRoadmap = null;
  const maxRetries = 2;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const aiResponse = await generatePersonalizedRoadmapWithAI(fullContext);
      validateRoadmap(aiResponse, fullContext);
      finalAiRoadmap = aiResponse;
      break; 
    } catch (err) {
      console.warn(`[RoadmapService] Validation/Generation failed (Attempt ${retryCount + 1}):`, err.message);
      retryCount++;
    }
  }

  if (!finalAiRoadmap) {
    console.error("[RoadmapService] All Gemini attempts failed. Using fallback.");
    finalAiRoadmap = generateDeterministicFallback(orderedSkills, careerGoal, studentContext);
  }

  // Map JSON into the mongoose schema format safely
  const { roadmap, short_roadmap } = finalAiRoadmap;

  const dbPhases = (roadmap.phases || []).map((phase, pIndex) => ({
    phaseId: phase.phase_id || `phase-${pIndex + 1}`,
    title: phase.title || "Phase",
    objective: phase.objective || "",
    priority: phase.priority || "MEDIUM",
    estimatedDuration: phase.estimated_duration || "",
    skills: (phase.skills || []).map((skill, sIndex) => ({
      skillId: skill.skill_id || `skill-${pIndex}-${sIndex}`,
      name: skill.name || "Unknown Skill",
      status: skill.status || "NOT_STARTED",
      priority: skill.priority || "MEDIUM",
      why: skill.why || "",
      prerequisites: skill.prerequisites || [],
      learningTasks: skill.learning_tasks || [],
      practiceTasks: skill.practice_tasks || [],
      projectTasks: skill.project_tasks || [],
      validation: skill.validation || [],
      estimatedHours: skill.estimated_hours || 0,
      dependencies: skill.dependencies || [],
      completionCriteria: skill.completion_criteria || [],
      progress: 0
    }))
  }));

  const dbShortRoadmap = {
    currentFocus: short_roadmap.current_focus || "",
    nextSteps: short_roadmap.next_steps || [],
    thisWeek: short_roadmap.this_week || [],
    nextMilestone: short_roadmap.next_milestone || ""
  };

  const newRoadmap = {
    userId: user._id,
    schemaVersion: 2,
    careerGoal: roadmap.career_goal || careerGoal,
    targetRole: roadmap.target_role || careerGoal,
    currentLevel: studentContext.currentLevel,
    roadmapTitle: roadmap.title || "Personalized AI Learning Roadmap",
    summary: roadmap.summary || "",
    estimatedDuration: roadmap.estimated_duration || "",
    confidence: roadmap.confidence || 0,
    phases: dbPhases,
    shortRoadmap: dbShortRoadmap,
    evidenceSnapshot: { assessmentCount: attempts.length, lastAttemptId: attempts[0]?._id }
  };

  const roadmapDoc = await UserRoadmap.findOneAndUpdate(
    { userId: user._id },
    newRoadmap,
    { new: true, upsert: true }
  );

  return roadmapDoc;
}
