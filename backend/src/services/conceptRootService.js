import AttemptResult from "../models/AttemptResult.js";
import { 
  getPrerequisites, 
  getConceptName, 
  getAllPrerequisites,
  getConceptPath 
} from "./conceptDependencyService.js";

/**
 * Deterministic ConceptRoot Engine
 * Implements strict evidence-backed root-cause analysis.
 */

const CONFIDENCE_THRESHOLDS = {
  INSUFFICIENT: 1,
  TENTATIVE: 2,
  MODERATE: 4,
  HIGH: 5
};

// Configurable recency weights (milliseconds)
const RECENCY_WEIGHTS = {
  RECENT: { maxAge: 14 * 24 * 60 * 60 * 1000, weight: 1.0 }, // 14 days
  MEDIUM: { maxAge: 30 * 24 * 60 * 60 * 1000, weight: 0.75 }, // 30 days
  OLD: { maxAge: Infinity, weight: 0.50 }
};

function isEdgeCaseQuestion(q) {
  const text = (q.questionText || "").toLowerCase();
  const answer = (q.correctAnswer || "").toLowerCase();
  
  const edgeKeywords = [
    "empty", "null", "undefined", "zero", "0", 
    "minimum", "maximum", "max", "min", "boundary",
    "edge case", "negative", "single element",
    "no elements", "duplicate"
  ];
  
  return edgeKeywords.some(kw => text.includes(kw) || answer.includes(kw));
}

function classifyError(q, attempt) {
  if (q.isCorrect) return null;
  
  if (q.mistakeType && ["CONCEPTUAL", "LOGICAL", "IMPLEMENTATION", "CARELESS", "MISINTERPRETATION", "TIME_MANAGEMENT"].includes(q.mistakeType)) {
    return q.mistakeType;
  }

  const text = (q.questionText || "").toLowerCase();
  const uAns = String(q.userAnswer || "").toLowerCase();
  
  if (q.status === "unanswered" || uAns === "") return "UNKNOWN";
  if (q.timeTaken && attempt.timeLimit && (q.timeTaken < 5 || q.timeTaken > attempt.timeLimit * 0.9)) {
    return "TIME_MANAGEMENT";
  }
  
  if (text.includes("boundary") || text.includes("edge") || text.includes("limit") || isEdgeCaseQuestion(q)) {
    return "LOGICAL";
  }
  if (text.includes("syntax") || text.includes("compile") || text.includes("error")) {
    return "IMPLEMENTATION";
  }
  if (text.includes("calculate") || text.includes("math") || text.includes("sum")) {
    return "CARELESS";
  }
  if (text.includes("define") || text.includes("what is")) {
    return "CONCEPTUAL";
  }
  
  return "CONCEPTUAL"; // Fallback for generalized failure
}

function extractEvidence(q, attempt) {
  const canonicalConcept = q.concept || q.canonicalConcept || "general";
  const skillId = q.topic || q.skillId || attempt.assessmentCategory || "general";
  
  return {
    questionId: q.questionId,
    attemptId: attempt._id.toString(),
    canonicalConcept,
    skillId,
    isCorrect: !!q.isCorrect,
    studentAnswer: q.userAnswer || "UNAVAILABLE",
    correctAnswer: q.correctAnswer || "UNAVAILABLE",
    errorType: classifyError(q, attempt),
    timestamp: attempt.completedAt || attempt.createdAt,
    isEdgeCase: isEdgeCaseQuestion(q),
    difficulty: q.difficulty || "Medium"
  };
}

function getRecencyWeight(timestamp) {
  const age = Date.now() - new Date(timestamp).getTime();
  if (age <= RECENCY_WEIGHTS.RECENT.maxAge) return RECENCY_WEIGHTS.RECENT.weight;
  if (age <= RECENCY_WEIGHTS.MEDIUM.maxAge) return RECENCY_WEIGHTS.MEDIUM.weight;
  return RECENCY_WEIGHTS.OLD.weight;
}

function calculateTrend(accuracy, recentAccuracy, totalAttempts) {
  if (totalAttempts < 3) return "INSUFFICIENT_DATA";
  
  const diff = recentAccuracy - accuracy;
  if (diff >= 0.1) return "IMPROVING";
  if (diff <= -0.1) return "DECLINING";
  
  if (recentAccuracy > 0.3 && recentAccuracy < 0.7) return "INCONSISTENT";
  return "STABLE";
}

function calculateConfidenceString(confidenceScore) {
  if (confidenceScore < 0.3) return "INSUFFICIENT_EVIDENCE";
  if (confidenceScore < 0.5) return "TENTATIVE";
  if (confidenceScore < 0.8) return "MODERATE_CONFIDENCE";
  return "HIGH_CONFIDENCE";
}

export async function calculateConceptRoot(userId) {
  const attempts = await AttemptResult.find({ userId }).sort({ completedAt: 1 }).lean(); // Sort oldest to newest

  if (!attempts || attempts.length === 0) {
    return {
      hasData: false,
      diagnosis: { status: "INSUFFICIENT_EVIDENCE" }
    };
  }

  // 1. Evidence Normalization & Aggregation
  const evidenceStore = [];
  const conceptMap = new Map();
  const seenIds = new Set(); // deduplication
  
  for (const attempt of attempts) {
    if (!attempt.questionResults) continue;

    for (const q of attempt.questionResults) {
      if (q.status === "unanswered" || q.status === "skipped") continue;
      
      const dedupKey = `${attempt._id}-${q.questionId}`;
      if (seenIds.has(dedupKey)) continue;
      seenIds.add(dedupKey);

      const evidence = extractEvidence(q, attempt);
      evidenceStore.push(evidence);
      
      const cid = evidence.canonicalConcept;
      if (!conceptMap.has(cid)) {
        conceptMap.set(cid, {
          conceptId: cid,
          canonicalConcept: getConceptName(cid),
          skillId: evidence.skillId,
          evidenceList: []
        });
      }
      conceptMap.get(cid).evidenceList.push(evidence);
    }
  }

  // 2. Concept Mastery Profiles
  const profiles = [];
  for (const [cid, data] of conceptMap.entries()) {
    let totalAttempts = 0;
    let correct = 0;
    let weightedTotal = 0;
    let weightedCorrect = 0;
    
    let edgeAttempts = 0;
    let edgeCorrect = 0;
    
    const errorFrequencies = {};

    for (const ev of data.evidenceList) {
      totalAttempts++;
      const weight = getRecencyWeight(ev.timestamp);
      weightedTotal += weight;
      
      if (ev.isCorrect) {
        correct++;
        weightedCorrect += weight;
        if (ev.isEdgeCase) edgeCorrect++;
      } else {
        errorFrequencies[ev.errorType] = (errorFrequencies[ev.errorType] || 0) + 1;
      }
      
      if (ev.isEdgeCase) edgeAttempts++;
    }

    const accuracy = totalAttempts > 0 ? (correct / totalAttempts) : 0;
    const recentAccuracy = weightedTotal > 0 ? (weightedCorrect / weightedTotal) : 0;
    const edgeCaseAccuracy = edgeAttempts > 0 ? (edgeCorrect / edgeAttempts) : null;
    
    let primaryRootCause = "UNKNOWN";
    let highestErrFreq = 0;
    for (const [errType, count] of Object.entries(errorFrequencies)) {
      if (count > highestErrFreq) {
        highestErrFreq = count;
        primaryRootCause = errType;
      }
    }

    // Mathematical confidence formula: (Error Consistency * Mistake Volume) - Recent Successes
    const mistakeVolumeFactor = Math.min(totalAttempts / CONFIDENCE_THRESHOLDS.HIGH, 1.0);
    const errorConsistency = totalAttempts > 0 ? (highestErrFreq / totalAttempts) : 0;
    const recentSuccessPenalty = recentAccuracy * 0.5; // Max 0.5 penalty
    
    let confidenceScore = (mistakeVolumeFactor * errorConsistency) - recentSuccessPenalty;
    confidenceScore = Math.max(0, Math.min(confidenceScore, 1.0));
    
    profiles.push({
      conceptId: cid,
      canonicalConcept: data.canonicalConcept,
      skillId: data.skillId,
      mastery: {
        attempts: totalAttempts,
        correct,
        accuracy: Number(accuracy.toFixed(3)),
        recentAccuracy: Number(recentAccuracy.toFixed(3)),
        edgeCaseAccuracy: edgeCaseAccuracy !== null ? Number(edgeCaseAccuracy.toFixed(3)) : null,
        trend: calculateTrend(accuracy, recentAccuracy, totalAttempts)
      },
      rootCause: {
        type: primaryRootCause,
        confidence: Number(confidenceScore.toFixed(2)),
        evidenceCount: highestErrFreq
      },
      evidence: data.evidenceList
    });
  }

  // 4. Find the Weakest Link
  let weakestProfile = null;
  let lowestAccuracy = 1.0;
  let mostRecentError = 0;

  for (const p of profiles) {
    if (p.mastery.attempts >= 1 && p.mastery.accuracy < 0.6) {
      // Find the most recent mistake for this concept
      const latestErrorTimestamp = p.evidence
        .filter(e => !e.isCorrect)
        .reduce((max, e) => Math.max(max, new Date(e.timestamp).getTime()), 0);

      // We want the most recently failed concept that has low accuracy
      if (latestErrorTimestamp > mostRecentError) {
        mostRecentError = latestErrorTimestamp;
        lowestAccuracy = p.mastery.accuracy;
        weakestProfile = p;
      } else if (latestErrorTimestamp === mostRecentError && p.mastery.accuracy < lowestAccuracy) {
        lowestAccuracy = p.mastery.accuracy;
        weakestProfile = p;
      }
    }
  }

  if (!weakestProfile) {
    // Return empty payload if no strong weakness
    const randomProfile = profiles.length > 0 ? profiles[0] : null;
    return {
      hasData: true,
      conceptId: randomProfile ? randomProfile.conceptId : null,
      canonicalConcept: randomProfile ? randomProfile.canonicalConcept : null,
      skillId: randomProfile ? randomProfile.skillId : null,
      mastery: randomProfile ? randomProfile.mastery : { attempts: 0, correct: 0, accuracy: 0, recentAccuracy: 0, trend: "INSUFFICIENT_DATA" },
      rootCause: { type: "UNKNOWN", confidence: 0, evidenceCount: 0 },
      evidence: [],
      dependencies: [],
      diagnosis: { status: "INSUFFICIENT_EVIDENCE" },
      explanation: null,
      sourceAttemptCount: attempts.length
    };
  }

  // 4. Concept Dependencies 
  const candidates = getAllPrerequisites(weakestProfile.conceptId);
  let bestRootProfile = weakestProfile;
  let highestRootConfidence = weakestProfile.rootCause.confidence;

  for (const candidateId of candidates) {
    const candidateProfile = profiles.find(p => p.conceptId === candidateId);
    if (candidateProfile && candidateProfile.mastery.attempts > 0 && candidateProfile.mastery.accuracy < 0.6) {
      // It is a valid root cause
      if (candidateProfile.rootCause.confidence >= highestRootConfidence) {
        highestRootConfidence = candidateProfile.rootCause.confidence;
        bestRootProfile = candidateProfile;
      }
    }
  }

  const rawDependencies = getConceptPath(weakestProfile.conceptId, bestRootProfile.conceptId);
  const dependencies = rawDependencies.map((id, idx) => ({
    id: id,
    name: getConceptName(id),
    type: idx === 0 ? "observed" : (idx === rawDependencies.length - 1 ? "root" : "intermediate"),
    level: idx
  }));

  // Calculate consistent combined metrics
  const combinedEvidence = [];
  const seenEv = new Set();
  for (const ev of [...weakestProfile.evidence, ...bestRootProfile.evidence]) {
    const key = `${ev.attemptId}-${ev.questionId}`;
    if (!seenEv.has(key)) {
      seenEv.add(key);
      combinedEvidence.push(ev);
    }
  }

  const combinedAttempts = combinedEvidence.length;
  const combinedCorrect = combinedEvidence.filter(e => e.isCorrect).length;
  const combinedAccuracy = combinedAttempts > 0 ? (combinedCorrect / combinedAttempts) : 0;
  const patternMatches = combinedEvidence.filter(e => !e.isCorrect && e.errorType === bestRootProfile.rootCause.type).length;

  // 5. Final Result Formation
  return {
    hasData: true,
    conceptId: weakestProfile.conceptId,
    canonicalConcept: weakestProfile.canonicalConcept,
    skillId: weakestProfile.skillId,
    mastery: {
      ...weakestProfile.mastery,
      attempts: combinedAttempts,
      correct: combinedCorrect,
      accuracy: Number(combinedAccuracy.toFixed(3))
    },
    
    rootCause: {
      type: bestRootProfile.rootCause.type,
      confidence: bestRootProfile.rootCause.confidence,
      evidenceCount: patternMatches,
      rootConceptId: bestRootProfile.conceptId,
      rootConceptName: bestRootProfile.canonicalConcept
    },

    evidence: combinedEvidence.filter(e => !e.isCorrect).slice(0, 8), // Provide max 8 key mistakes for LLM reasoning
    
    dependencies,
    
    diagnosis: {
      status: calculateConfidenceString(weakestProfile.rootCause.confidence)
    },
    
    explanation: null, // To be filled by Gemini
    sourceAttemptCount: attempts.length
  };
}
