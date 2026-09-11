/**
 * prioritizationService.js
 * Calculates deterministic priority for skills based on career relevance,
 * mistake frequency, and prerequisite blockages.
 */

export const calculateSkillPriorities = (careerRequirements, studentContext) => {
  const { mistakeMap = {}, conceptRoot = [] } = studentContext;
  
  // Create a map for quick mistake lookup.
  // mistakeMap.recurringMistakes might be an array of strings like "Arrays (3 times)"
  // We'll just do simple string matching for now.
  const mistakeString = JSON.stringify(mistakeMap).toLowerCase();
  const rootString = JSON.stringify(conceptRoot).toLowerCase();

  const prioritizedSkills = careerRequirements.skills.map(skill => {
    let score = 0;
    let reason = "";
    
    // 1. Career Relevance (Base Score)
    // importance is between 0.0 and 1.0. Multiply by 40 for max 40 points.
    score += skill.importance * 40;
    
    // 2. Knowledge Gap (Default to high for now if not already mastered)
    // We assume any required skill not yet mastered needs attention.
    score += 20;

    // 3. Repeated Mistake Signal
    const skillKeywords = skill.name.toLowerCase().split(" ");
    let mistakeFound = false;
    for (const kw of skillKeywords) {
      if (kw.length > 3 && mistakeString.includes(kw)) {
        score += 25;
        mistakeFound = true;
        break;
      }
    }

    // 4. Prerequisite Blockage (ConceptRoot)
    let rootFound = false;
    for (const kw of skillKeywords) {
      if (kw.length > 3 && rootString.includes(kw)) {
        score += 35; // Very high priority if it's a root cause
        rootFound = true;
        break;
      }
    }

    // Normalize to CRITICAL, HIGH, MEDIUM, LOW
    let priority = "LOW";
    if (score >= 90) {
      priority = "CRITICAL";
      reason = "Fundamental prerequisite blocking other skills and frequent mistake source.";
    } else if (score >= 70) {
      priority = "HIGH";
      reason = "Highly important for career goal and evidence shows knowledge gaps.";
    } else if (score >= 50) {
      priority = "MEDIUM";
      reason = "Core career requirement.";
    } else {
      priority = "LOW";
      reason = "Optional or secondary career requirement.";
    }

    // Override reason if specific triggers hit
    if (rootFound) {
      reason = "Identified as a root cause for repeated assessment failures.";
      if (priority === "LOW" || priority === "MEDIUM") priority = "HIGH";
    } else if (mistakeFound) {
      reason = "Frequent mistakes detected in recent assessments.";
      if (priority === "LOW") priority = "MEDIUM";
    }

    return {
      ...skill,
      calculatedPriority: priority,
      priorityScore: score,
      backendReason: reason
    };
  });

  return prioritizedSkills;
};
