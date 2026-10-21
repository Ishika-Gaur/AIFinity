import UserRoadmap from "../models/UserRoadmap.js";
import { generateAndSaveRoadmap } from "../services/roadmapService.js";
import { updateSkillStatus } from "../services/roadmapProgressService.js";
import { normalizeCourseId } from "./analyticsController.js";

export async function getRoadmap(req, res) {
  try {
    const user = req.user;
    const courseId = req.query.courseId ? normalizeCourseId(req.query.courseId) : null;
    
    // Objective 1 & 2: Strict user isolation & multi-course persistence
    const query = { userId: user._id };
    if (courseId) query.courseId = courseId;

    let roadmap = await UserRoadmap.findOne(query).sort({ lastAccessed: -1 }).lean();
    if (!roadmap && courseId) {
      roadmap = await UserRoadmap.findOne({ userId: user._id }).sort({ lastAccessed: -1 }).lean();
    }
    
    if (!roadmap) {
      return res.json({ success: true, data: { hasRoadmap: false } });
    }

    return res.json({ success: true, data: { hasRoadmap: true, roadmap } });
  } catch (err) {
    console.error("[Roadmap] Error fetching roadmap:", err);
    return res.status(500).json({ success: false, message: "Unable to load your Roadmap." });
  }
}

export async function generateRoadmap(req, res) {
  try {
    const user = req.user;
    const { courseId: rawCourseId, careerGoal: bodyCareer } = req.body || {};
    const careerGoal = bodyCareer || user.onboardingProfile?.careerGoal || user.selectedField || "Software Engineer";
    const courseId = rawCourseId ? normalizeCourseId(rawCourseId) : normalizeCourseId(careerGoal);
    
    const roadmapDoc = await generateAndSaveRoadmap(user, careerGoal, courseId);
    
    return res.json({ success: true, data: { hasRoadmap: true, roadmap: roadmapDoc } });
  } catch (err) {
    console.error("[Roadmap] Error generating roadmap:", err);
    if (err.message.includes("Insufficient assessment data")) {
      return res.json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Unable to generate Roadmap." });
  }
}

export async function regenerateRoadmap(req, res) {
  return generateRoadmap(req, res);
}

export async function updateStepStatus(req, res) {
  try {
    const { stepId } = req.params;
    const { status, courseId } = req.body; 

    const roadmap = await updateSkillStatus(req.user._id, stepId, status, courseId);
    
    return res.json({ success: true, data: { roadmap } });
  } catch (err) {
    console.error("[Roadmap] Error updating step status:", err);
    if (err.message === "Roadmap not found" || err.message === "Skill not found in roadmap") {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Unable to update step." });
  }
}
