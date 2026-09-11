/**
 * roadmapValidator.js
 * Validates the AI-generated Roadmap JSON against structural and logical constraints.
 */

export const validateRoadmap = (aiRoadmap, studentContext) => {
  if (!aiRoadmap) throw new Error("Validation Failed: Empty roadmap");
  if (!aiRoadmap.roadmap || !aiRoadmap.short_roadmap) {
    throw new Error("Validation Failed: Missing 'roadmap' or 'short_roadmap' object");
  }

  const { roadmap, short_roadmap } = aiRoadmap;

  if (!Array.isArray(roadmap.phases) || roadmap.phases.length === 0) {
    throw new Error("Validation Failed: Roadmap must have at least one phase");
  }

  const skillIds = new Set();
  
  // Validate structure and prevent duplicates
  for (const phase of roadmap.phases) {
    if (!phase.title) throw new Error("Validation Failed: Phase missing title");
    if (!Array.isArray(phase.skills)) throw new Error("Validation Failed: Phase missing skills array");

    for (const skill of phase.skills) {
      if (!skill.skill_id || !skill.name) {
        throw new Error("Validation Failed: Skill missing id or name");
      }
      if (skillIds.has(skill.skill_id)) {
        throw new Error(`Validation Failed: Duplicate skill ID detected (${skill.skill_id})`);
      }
      skillIds.add(skill.skill_id);

      if (skill.estimated_hours < 0) {
        throw new Error(`Validation Failed: Negative estimated hours on skill ${skill.skill_id}`);
      }
    }
  }

  // Validate Short Roadmap
  if (!short_roadmap.current_focus || !Array.isArray(short_roadmap.next_steps)) {
    throw new Error("Validation Failed: Malformed short_roadmap");
  }

  return true;
};
