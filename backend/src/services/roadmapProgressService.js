/**
 * roadmapProgressService.js
 * Handles lightweight updates to the roadmap progress.
 * Future adaptive learning logic (e.g. dynamically unlocking new phases) will go here.
 */

import UserRoadmap from "../models/UserRoadmap.js";

export const updateSkillStatus = async (userId, skillId, status) => {
  const roadmap = await UserRoadmap.findOne({ userId });
  if (!roadmap) throw new Error("Roadmap not found");

  let skillFound = false;
  
  for (const phase of roadmap.phases) {
    for (const skill of phase.skills) {
      if (skill.skillId === skillId || skill._id?.toString() === skillId) {
        skill.status = status;
        // Basic progress handling
        if (status === "COMPLETED") {
          skill.progress = 100;
        } else if (status === "IN_PROGRESS") {
          if (skill.progress < 10) skill.progress = 10;
        }
        skillFound = true;
        break;
      }
    }
    if (skillFound) break;
  }

  if (!skillFound) {
    throw new Error("Skill not found in roadmap");
  }

  await roadmap.save();
  return roadmap;
};
