import crypto from "crypto";
import AttemptResult from "../models/AttemptResult.js";
import Revision from "../models/Revision.js";
import { generateRevisionSession } from "./geminiService.js";

// Spaced Repetition Intervals in Days
const INTERVALS = [1, 3, 7, 14, 30, 60];

// Helper to hash evidence for cache invalidation
function generateEvidenceHash(incorrectAttempts) {
  if (!incorrectAttempts || incorrectAttempts.length === 0) return "no-evidence";
  const str = incorrectAttempts.map(a => `${a.questionId}:${a.userAnswer}`).join("|");
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function getRevisionDashboardData(userId) {
  // 1. Fetch Attempt Results for evidence
  const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
  
  const conceptMap = new Map();

  // Aggregate accuracy per concept
  for (const attempt of attempts) {
    if (!attempt.questionResults) continue;
    for (const q of attempt.questionResults) {
      if (q.status === "unanswered" || q.status === "skipped") continue;
      
      // Need a canonical concept identifier. Fallback to topic if concept is missing.
      const conceptName = (q.concept || q.topic || "General").trim();
      const conceptId = conceptName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      
      if (!conceptMap.has(conceptId)) {
        conceptMap.set(conceptId, {
          conceptId,
          conceptName,
          correct: 0,
          incorrect: 0,
          total: 0,
          lastAttemptAt: attempt.completedAt,
        });
      }
      
      const stat = conceptMap.get(conceptId);
      stat.total++;
      if (q.isCorrect || q.status === "correct" || (q.marksAwarded && q.marksAwarded >= 7)) {
        stat.correct++;
      } else {
        stat.incorrect++;
      }
      // Ensure we keep the most recent attempt date (since we sorted by completedAt -1, the first seen is most recent)
      if (new Date(attempt.completedAt) > new Date(stat.lastAttemptAt)) {
        stat.lastAttemptAt = attempt.completedAt;
      }
    }
  }

  // 2. Fetch Revision States
  const revisions = await Revision.find({ userId }).lean();
  const revisionMap = new Map();
  for (const rev of revisions) {
    revisionMap.set(rev.conceptId, rev);
  }

  // 3. Build Concept Revision Items
  const revisionItems = [];
  const now = new Date();

  for (const [conceptId, stat] of conceptMap.entries()) {
    const accuracy = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
    const rev = revisionMap.get(conceptId);
    
    // Determine if it should be shown in Revision Center
    let isDue = false;
    let priorityLevel = "LOW";
    let priorityScore = 0;

    // It's due if scheduled review is past OR if accuracy is low and it hasn't been reviewed yet
    if (rev && rev.nextReviewAt && new Date(rev.nextReviewAt) <= now) {
      isDue = true;
      priorityScore += 50; // Due items get high priority
    } else if (!rev && accuracy < 75 && stat.total >= 1) { // Only suggest if they actually have a weakness
      isDue = true;
      priorityScore += 30; // New weaknesses get priority
    }

    if (rev && rev.status === "DUE") {
      isDue = true;
    }

    // Include if it's due OR if we have a revision record for it (to show history/completed)
    if (isDue || rev) {
      priorityScore += (100 - accuracy); // Lower accuracy = higher priority
      
      if (priorityScore >= 80) priorityLevel = "HIGH";
      else if (priorityScore >= 40) priorityLevel = "MEDIUM";
      else priorityLevel = "LOW";

      // Mastery labeling
      let masteryLevel = "Needs Attention";
      if (accuracy >= 80) masteryLevel = "Strong";
      else if (accuracy >= 60) masteryLevel = "Improving";
      else if (accuracy >= 40) masteryLevel = "Developing";

      revisionItems.push({
        conceptId,
        conceptName: stat.conceptName,
        priority: priorityLevel,
        priorityScore,
        status: isDue ? "DUE" : "COMPLETED",
        weaknessScore: 100 - accuracy,
        masteryScore: Math.round(accuracy),
        masteryLevel,
        revisionCount: rev ? rev.revisionCount : 0,
        lastAttemptedAt: stat.lastAttemptAt,
        lastReviewedAt: rev ? rev.lastReviewedAt : null,
        nextReviewAt: rev ? rev.nextReviewAt : null,
        incorrectAttempts: stat.incorrect,
      });
    }
  }

  // Sort by priority score DESC
  revisionItems.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    items: revisionItems,
    summary: {
      dueToday: revisionItems.filter(i => i.status === "DUE").length,
      highPriority: revisionItems.filter(i => i.priority === "HIGH").length,
      completed: revisionItems.filter(i => i.status === "COMPLETED").length,
      total: revisionItems.length,
    }
  };
}

export async function getRevisionSession(userId, conceptId) {
  // 1. Get recent mistakes for this concept
  const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
  const incorrectEvidence = [];
  let conceptName = conceptId; // Fallback
  
  for (const attempt of attempts) {
    if (!attempt.questionResults) continue;
    for (const q of attempt.questionResults) {
      const qConceptName = (q.concept || q.topic || "General").trim();
      const qConceptId = qConceptName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      
      if (qConceptId === conceptId) {
        conceptName = qConceptName;
        const isCorrect = q.isCorrect || q.status === "correct" || (q.marksAwarded && q.marksAwarded >= 7);
        if (!isCorrect) {
          incorrectEvidence.push({
            questionId: q.questionId || q._id,
            questionText: q.questionText || q.question,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            mistakeType: q.mistakeType,
          });
        }
      }
    }
    // Limit to 5 most recent mistakes to avoid huge prompts
    if (incorrectEvidence.length >= 5) break; 
  }

  const evidenceHash = generateEvidenceHash(incorrectEvidence);
  
  // 2. Find or Create Revision
  let revision = await Revision.findOne({ userId, conceptId });
  if (!revision) {
    revision = new Revision({ userId, conceptId, conceptName });
  }

  // 3. Check Cache
  if (
    revision.aiContent &&
    revision.aiContent.content &&
    revision.aiContent.evidenceHash === evidenceHash
  ) {
    return {
      sessionContent: revision.aiContent.content,
      isCached: true,
      conceptName
    };
  }

  // 4. Generate New Session Content via AI
  const promptContext = {
    concept: conceptName,
    incorrectAttempts: incorrectEvidence.length,
    evidenceDetails: incorrectEvidence.map(e => ({
      question: e.questionText,
      studentAnswer: e.userAnswer,
      correctAnswer: e.correctAnswer
    }))
  };

  const sessionContent = await generateRevisionSession(promptContext);
  
  if (!sessionContent) {
    throw 
    new Error("Failed to generate revision session.");
  }

  // 5. Update Cache
  revision.aiContent = {
    contentVersion: "1.0",
    evidenceHash,
    generatedAt: new Date(),
    content: sessionContent
  };
  await revision.save();

  return {
    sessionContent,
    isCached: false,
    conceptName
  };
}

export async function completeRevisionSession(userId, conceptId, performance) {
  const { practiceAccuracy, confidence } = performance;
  
  const revision = await Revision.findOne({ userId, conceptId });
  if (!revision) {
    throw new Error("Revision record not found for completion.");
  }

  revision.revisionCount += 1;
  revision.lastReviewedAt = new Date();
  
  // Spaced Repetition Logic
  // Confidence scale: 1 (Not confident) to 4 (Very confident)
  // practiceAccuracy: 0 to 100
  
  let nextIntervalIndex = INTERVALS.indexOf(revision.intervalDays);
  if (nextIntervalIndex === -1) nextIntervalIndex = 0; // Default to 1 day

  if (practiceAccuracy >= 80 && confidence >= 3) {
    // Mastered this round, move to next interval
    nextIntervalIndex = Math.min(nextIntervalIndex + 1, INTERVALS.length - 1);
  } else if (practiceAccuracy < 50 || confidence <= 1) {
    // Failed significantly, reset or move back
    nextIntervalIndex = Math.max(0, nextIntervalIndex - 1);
  } else {
    // Maintained, stay at current interval
  }

  const nextIntervalDays = INTERVALS[nextIntervalIndex];
  revision.intervalDays = nextIntervalDays;
  
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextIntervalDays);
  revision.nextReviewAt = nextDate;
  
  revision.status = "NOT_DUE";

  await revision.save();

  return {
    nextReviewAt: revision.nextReviewAt,
    intervalDays: revision.intervalDays,
    revisionCount: revision.revisionCount
  };
}
