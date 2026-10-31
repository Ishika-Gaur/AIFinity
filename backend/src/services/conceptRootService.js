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

export function cleanName(name) {
  if (!name) return "General";
  try {
    return decodeURIComponent(String(name))
      .replace(/^ai_rec_/i, "")
      .replace(/_/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^(\w)/, (c) => c.toUpperCase());
  } catch {
    return String(name).replace(/^ai_rec_/i, "").replace(/_/g, " ").trim();
  }
}

function isEdgeCaseQuestion(q) {
  const text = (q.questionText || q.question || "").toLowerCase();
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
  const isCorrect = !!(q.isCorrect === true || q.status === "correct" || Number(q.marksAwarded) >= 7);
  if (isCorrect) return null;
  
  if (q.mistakeType && ["CONCEPTUAL", "LOGICAL", "IMPLEMENTATION", "CARELESS", "MISINTERPRETATION", "TIME_MANAGEMENT"].includes(String(q.mistakeType).toUpperCase())) {
    return String(q.mistakeType).toUpperCase();
  }

  const text = (q.questionText || q.question || "").toLowerCase();
  const uAns = String(q.userAnswer || "").toLowerCase();
  
  if (q.status === "unanswered" || uAns === "") return "UNKNOWN";
  if (q.timeTaken && attempt.timeLimit && (q.timeTaken < 5 || q.timeTaken > attempt.timeLimit * 0.9)) {
    return "TIME_MANAGEMENT";
  }
  
  if (text.includes("boundary") || text.includes("edge") || text.includes("limit") || isEdgeCaseQuestion(q)) {
    return "LOGICAL";
  }
  if (text.includes("syntax") || text.includes("compile") || text.includes("error") || text.includes("implement") || text.includes("code")) {
    return "IMPLEMENTATION";
  }
  if (text.includes("calculate") || text.includes("math") || text.includes("sum") || text.includes("formula")) {
    return "CARELESS";
  }
  if (text.includes("define") || text.includes("what is") || text.includes("which of") || text.includes("principle")) {
    return "CONCEPTUAL";
  }
  
  return "CONCEPTUAL"; // Fallback for generalized failure
}

function extractEvidence(q, attempt) {
  const rawConcept = q.concept || q.canonicalConcept || q.topic || attempt.assessmentCategory || "General";
  const canonicalConcept = cleanName(rawConcept);
  const rawSkill = q.topic || q.skillId || attempt.assessmentCategory || "General";
  const skillId = cleanName(rawSkill);
  const isCorrect = !!(q.isCorrect === true || q.status === "correct" || Number(q.marksAwarded) >= 7);
  
  return {
    questionId: q.questionId || `q_${Math.random().toString(36).substr(2, 9)}`,
    question: q.questionText || q.question || "",
    attemptId: attempt._id ? attempt._id.toString() : String(attempt.attemptId || ""),
    canonicalConcept,
    skillId,
    isCorrect,
    studentAnswer: q.userAnswer || "UNAVAILABLE",
    correctAnswer: q.correctAnswer || "UNAVAILABLE",
    errorType: classifyError(q, attempt),
    timestamp: attempt.completedAt || attempt.createdAt || new Date(),
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
  if (confidenceScore === "MASTERED") return "MASTERED";
  if (typeof confidenceScore === "number") {
    if (confidenceScore < 0.3) return "INSUFFICIENT_EVIDENCE";
    if (confidenceScore < 0.5) return "TENTATIVE";
    if (confidenceScore < 0.8) return "MODERATE_CONFIDENCE";
    return "HIGH_CONFIDENCE";
  }
  return "TENTATIVE";
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
    if (!attempt.questionResults || attempt.questionResults.length === 0) continue;

    for (const q of attempt.questionResults) {
      if (q.status === "skipped") continue;
      
      const dedupKey = `${attempt._id}-${q.questionId || q.questionText || Math.random()}`;
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

  if (evidenceStore.length === 0) {
    return {
      hasData: false,
      diagnosis: { status: "INSUFFICIENT_EVIDENCE" }
    };
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
        const errType = ev.errorType || "CONCEPTUAL";
        errorFrequencies[errType] = (errorFrequencies[errType] || 0) + 1;
      }
      
      if (ev.isEdgeCase) edgeAttempts++;
    }

    const accuracy = totalAttempts > 0 ? (correct / totalAttempts) : 0;
    const recentAccuracy = weightedTotal > 0 ? (weightedCorrect / weightedTotal) : 0;
    const edgeCaseAccuracy = edgeAttempts > 0 ? (edgeCorrect / edgeAttempts) : null;
    
    let primaryRootCause = "CONCEPTUAL";
    let highestErrFreq = 0;
    for (const [errType, count] of Object.entries(errorFrequencies)) {
      if (count > highestErrFreq) {
        highestErrFreq = count;
        primaryRootCause = errType;
      }
    }

    // Dynamic Evidence Confidence:
    // If mistakes exist (highestErrFreq >= 1):
    // 1 mistake: 0.45 (Tentative - initial actionable signal from recent assignment)
    // 2 mistakes: 0.65 (Moderate - verified recurring pattern)
    // 3+ mistakes: 0.85+ (High - deeply established root cause)
    let confidenceScore = 0;
    if (highestErrFreq === 1) {
      confidenceScore = 0.45;
    } else if (highestErrFreq === 2) {
      confidenceScore = 0.65;
    } else if (highestErrFreq >= 3) {
      confidenceScore = Math.min(0.95, 0.80 + (highestErrFreq * 0.05));
    } else {
      confidenceScore = 1.0;
    }
    
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

  // 3. Find the Concept with Mistakes (Weakest Link)
  const profilesWithMistakes = profiles.filter(p => (p.mastery.attempts - p.mastery.correct) > 0);

  let weakestProfile = null;
  if (profilesWithMistakes.length > 0) {
    profilesWithMistakes.sort((a, b) => {
      // 1. Lowest accuracy first
      if (a.mastery.accuracy !== b.mastery.accuracy) {
        return a.mastery.accuracy - b.mastery.accuracy;
      }
      // 2. Highest mistake count first
      const aMistakes = a.mastery.attempts - a.mastery.correct;
      const bMistakes = b.mastery.attempts - b.mastery.correct;
      if (aMistakes !== bMistakes) {
        return bMistakes - aMistakes;
      }
      // 3. Most recent mistake timestamp
      const aRecent = a.evidence.filter(e => !e.isCorrect).reduce((m, e) => Math.max(m, new Date(e.timestamp).getTime()), 0);
      const bRecent = b.evidence.filter(e => !e.isCorrect).reduce((m, e) => Math.max(m, new Date(e.timestamp).getTime()), 0);
      return bRecent - aRecent;
    });

    weakestProfile = profilesWithMistakes[0];
  }

  if (!weakestProfile) {
    // Return mastered state when all attempts were 100% correct
    const firstProfile = profiles.length > 0 ? profiles[0] : null;
    return {
      hasData: true,
      isMastered: true,
      conceptId: firstProfile ? firstProfile.conceptId : "all-concepts",
      canonicalConcept: firstProfile ? firstProfile.canonicalConcept : "All Concepts",
      skillId: firstProfile ? firstProfile.skillId : "General",
      mastery: firstProfile ? firstProfile.mastery : { attempts: 0, correct: 0, accuracy: 1.0, recentAccuracy: 1.0, trend: "STABLE" },
      rootCause: {
        type: "MASTERED",
        confidence: 1.0,
        evidenceCount: 0,
        rootConceptId: firstProfile ? firstProfile.conceptId : "all-concepts",
        rootConceptName: firstProfile ? firstProfile.canonicalConcept : "All Concepts"
      },
      evidence: [],
      dependencies: [],
      diagnosis: { status: "MASTERED" },
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
    if (candidateProfile && (candidateProfile.mastery.attempts - candidateProfile.mastery.correct) > 0) {
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
    isMastered: false,
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
      evidenceCount: Math.max(patternMatches, 1),
      rootConceptId: bestRootProfile.conceptId,
      rootConceptName: bestRootProfile.canonicalConcept
    },

    evidence: combinedEvidence.filter(e => !e.isCorrect), // Full 1-to-1 breakdown of all incorrect submissions without truncation
    
    dependencies,
    
    diagnosis: {
      status: calculateConfidenceString(bestRootProfile.rootCause.confidence)
    },
    
    explanation: null, // To be filled by Gemini or pedagogical fallback
    sourceAttemptCount: attempts.length
  };
}
