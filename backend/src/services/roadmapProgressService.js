/**
 * roadmapProgressService.js
 * Handles lightweight updates to the roadmap progress with multi-course support.
 */

import UserRoadmap from "../models/UserRoadmap.js";
import { normalizeCourseId } from "../controllers/analyticsController.js";

export const updateSkillStatus = async (userId, skillId, status, courseId = null) => {
  const query = { userId };
  if (courseId) query.courseId = normalizeCourseId(courseId);

  let roadmap = await UserRoadmap.findOne(query);
  if (!roadmap) {
    roadmap = await UserRoadmap.findOne({ userId });
  }
  if (!roadmap) throw new Error("Roadmap not found");

  let skillFound = false;

  // Handle stages array if present
  if (Array.isArray(roadmap.stages)) {
    for (const stage of roadmap.stages) {
      if (stage.id === Number(skillId) || stage._id?.toString() === skillId) {
        stage.status = status;
        if (status === "completed") {
          stage.progress = 100;
          if (!roadmap.completedStageIds.includes(stage.id)) {
            roadmap.completedStageIds.push(stage.id);
          }
        }
        skillFound = true;
        break;
      }
    }
  }
  
  if (Array.isArray(roadmap.phases)) {
    for (const phase of roadmap.phases) {
      for (const skill of phase.skills || []) {
        if (skill.skillId === skillId || skill._id?.toString() === skillId) {
          skill.status = status;
          if (status === "COMPLETED" || status === "completed") {
            skill.progress = 100;
          } else if (status === "IN_PROGRESS" || status === "current") {
            if (skill.progress < 10) skill.progress = 10;
          }
          skillFound = true;
          break;
        }
      }
      if (skillFound) break;
    }
  }

  if (!skillFound) {
    throw new Error("Skill not found in roadmap");
  }

  roadmap.lastAccessed = new Date();
  await roadmap.save();
  return roadmap;
};
