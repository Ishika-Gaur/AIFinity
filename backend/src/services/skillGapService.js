import AttemptResult from "../models/AttemptResult.js";
import { getCareerRequirements } from "./careerRequirementService.js";

/**
 * Deterministic SkillGap Engine
 * Phase 2B Implementation
 */

export async function calculateSkillGap(userId, careerGoal) {
  // 1. Fetch historical evidence
  const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
  const requirements = await getCareerRequirements(careerGoal);

  // Default to empty if no history
  if (!attempts || attempts.length === 0) {
    return {
      hasData: false,
      careerGoal: requirements.role,
      metrics: [],
      unmappedEvidenceCount: 0,
    };
  }

  // 2. Aggregate performance deterministically
  const skillAggregates = {};
  let unmappedCount = 0;

  for (const attempt of attempts) {
    if (!attempt.questionResults) continue;

    for (const q of attempt.questionResults) {
      // Unanswered != incorrect. Exclude from denominator.
      if (q.status === "unanswered" || q.status === "skipped") {
        continue; 
      }

      // Use canonicalSkill, fallback to canonicalConcept ONLY if we want.
      // The prompt says: "If canonicalSkill === null/empty/unknown then mark the evidence as unmapped and exclude it from authoritative skill-level performance calculations."
      // BUT, in V2A it's possible canonicalSkill wasn't fully populated. 
      // I will follow the strict rule: must use canonicalSkill, DO NOT fallback to assessmentCategory.
      const skillName = q.canonicalSkill;

      if (!skillName) {
        unmappedCount++;
        continue;
      }

      if (!skillAggregates[skillName]) {
        skillAggregates[skillName] = {
          skillId: skillName.toLowerCase().replace(/\s+/g, "_"),
          name: skillName,
          marksAwarded: 0,
          maxMarks: 0,
          evidenceCount: 0,
          attemptIds: new Set(),
        };
      }

      skillAggregates[skillName].marksAwarded += (q.marksAwarded || 0);
      skillAggregates[skillName].maxMarks += (q.maxMarks || 10); // Assume 10 if missing
      skillAggregates[skillName].evidenceCount += 1;
      skillAggregates[skillName].attemptIds.add(attempt._id.toString());
    }
  }

  // 3. Compute Metrics per Skill
  const metricsMap = new Map();

  for (const [skillName, data] of Object.entries(skillAggregates)) {
    let performance = 0;
    if (data.maxMarks > 0) {
      performance = Math.round((data.marksAwarded / data.maxMarks) * 100);
    }
    
    // Confidence heuristic: min 1.0 based on evidence count (cap at 10 items) and attempt spread
    const evidenceScore = Math.min(data.evidenceCount / 10, 1.0);
    const attemptScore = Math.min(data.attemptIds.size / 3, 1.0);
    const confidence = Number(((evidenceScore * 0.7) + (attemptScore * 0.3)).toFixed(2));

    metricsMap.set(skillName.toLowerCase(), {
      skillId: data.skillId,
      name: skillName,
      currentPerformance: performance,
      confidence,
      evidenceCount: data.evidenceCount,
      attemptCount: data.attemptIds.size,
      sourceAttemptIds: Array.from(data.attemptIds),
    });
  }

  // 4. Align with Career Requirements
  const finalMetrics = [];

  for (const reqSkill of requirements.skills) {
    const key = reqSkill.name.toLowerCase();
    const metric = metricsMap.get(key) || {
      skillId: reqSkill.id,
      name: reqSkill.name,
      currentPerformance: null,
      confidence: 0,
      evidenceCount: 0,
      attemptCount: 0,
      sourceAttemptIds: [],
    };

    // importance is a 0.0 - 1.0 float in V1. Map to requiredPerformance.
    const requiredPerformance = reqSkill.requiredPerformance || Math.round(reqSkill.importance * 100);
    
    // Gap calculation
    const gap = metric.evidenceCount === 0 
      ? null 
      : Math.max(0, requiredPerformance - metric.currentPerformance);

    // Status and Priority determination (Deterministic)
    let status = "insufficient_evidence";
    let priority = "low";

    if (metric.evidenceCount > 0) {
      if (gap > 20) {
        status = "gap";
        priority = "high";
      } else if (gap > 0) {
        status = "gap";
        priority = "medium";
      } else {
        status = "strong";
        priority = "low";
      }
    }

    finalMetrics.push({
      ...metric,
      requiredPerformance,
      importance: reqSkill.importance,
      gap,
      status,
      priority,
      isRequirement: true,
    });

    metricsMap.delete(key);
  }

  // 5. Add any remaining demonstrated skills not in requirements
  for (const [key, metric] of metricsMap.entries()) {
    let status = "insufficient_evidence";
    let priority = "low";

    if (metric.evidenceCount > 0) {
      if (metric.currentPerformance >= 75) {
        status = "strong";
      } else {
        status = "gap";
        priority = "medium";
      }
    }

    finalMetrics.push({
      ...metric,
      requiredPerformance: null,
      gap: null,
      status,
      priority,
      isRequirement: false,
    });
  }

  return {
    hasData: true,
    careerGoal: requirements.role,
    metrics: finalMetrics,
    unmappedEvidenceCount: unmappedCount,
    sourceAttemptCount: attempts.length,
    calculatedAt: new Date().toISOString(),
    calculationVersion: "2B",
  };
}
