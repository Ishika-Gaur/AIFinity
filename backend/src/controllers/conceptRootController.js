import AttemptResult from "../models/AttemptResult.js";
import ConceptRootAnalysis from '../models/ConceptRootAnalysis.js';
import { analyzeConceptRootWithAI } from "../services/geminiService.js";
import { getCandidateRoots, isValidConcept, isValidErrorType, isValidStatus } from "../services/knowledgeService.js";
import crypto from 'crypto';

/**
 * Builds structured evidence from failed attempts for a given target concept.
 */
function buildStructuredEvidence(attempts, targetConceptId) {
  const evidence = [];
  attempts.forEach(attempt => {
    (attempt.questionResults || []).forEach(q => {
      if (q.canonicalConcept === targetConceptId && !q.isCorrect) {
        evidence.push({
          questionId: q.questionId,
          questionText: q.questionText,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty
        });
      }
    });
  });
  return evidence;
}

/**
 * Deterministic confidence calculation based on evidence volume and error severity.
 */
function calculateConfidence(evidenceCount, errorType) {
  if (evidenceCount === 0) return 0;
  
  // Base confidence on the number of failed attempts
  let confidence = Math.min(evidenceCount * 25, 75); 
  
  // Specific error types indicate stronger signals
  const highConfidenceErrors = ["invariant_violation", "boundary_error", "misapplied_rule"];
  if (highConfidenceErrors.includes(errorType)) {
    confidence += 15;
  }
  
  return Math.min(confidence, 99);
}

function computeEvidenceHash(evidence) {
  return crypto.createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
}

/**
 * GET /api/concept-root
 * Returns personalized ConceptRoot analysis for the authenticated user.
 */
export async function getConceptRoot(req, res) {
  try {
    const user = req.user;

    // Fetch all attempts for this user, sorted most recent first
    const attempts = await AttemptResult.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .lean();

    if (!attempts || attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          user: { id: String(user._id), name: user.name, email: user.email },
          learningDiagnosis: { hasDiagnosis: false }
        }
      });
    }

    // Determine the most failed concept (targetConceptId)
    const failuresByConcept = {};
    attempts.forEach(a => {
      (a.questionResults || []).forEach(q => {
        if (!q.isCorrect && q.canonicalConcept) {
          failuresByConcept[q.canonicalConcept] = (failuresByConcept[q.canonicalConcept] || 0) + 1;
        }
      });
    });

    // Sort by failure count
    const sortedConcepts = Object.keys(failuresByConcept).sort((a, b) => failuresByConcept[b] - failuresByConcept[a]);
    const targetConceptId = sortedConcepts[0] || null;

    if (!targetConceptId || !isValidConcept(targetConceptId)) {
      return res.json({
        success: true,
        data: {
          user: { id: String(user._id), name: user.name, email: user.email },
          learningDiagnosis: { hasDiagnosis: false }
        }
      });
    }

    const latestAttemptId = attempts[0]._id;
    const sourceAttemptIds = attempts.map(a => a._id);
    const structuredEvidence = buildStructuredEvidence(attempts, targetConceptId);
    const evidenceHash = computeEvidenceHash(structuredEvidence);
    const candidateRoots = getCandidateRoots(targetConceptId);

    // Check Cache
    const cachedAnalysis = await ConceptRootAnalysis.findOne({ 
      userId: user._id, 
      targetConceptId,
      evidenceHash
    }).lean();

    let learningDiagnosis;

    if (cachedAnalysis) {
      learningDiagnosis = { ...cachedAnalysis, hasDiagnosis: true };
    } else if (structuredEvidence.length > 0) {
      // Execute LLM Inference as an interpreter
      const aiResponse = await analyzeConceptRootWithAI(targetConceptId, candidateRoots, structuredEvidence);

      let finalStatus = aiResponse.status;
      let finalErrorType = aiResponse.errorType;
      
      if (!isValidStatus(finalStatus)) finalStatus = "insufficient_evidence";
      if (!isValidErrorType(finalErrorType)) finalErrorType = "unknown";

      const confidence = finalStatus === "diagnosed" 
        ? calculateConfidence(structuredEvidence.length, finalErrorType)
        : 0;

      // Save analysis
      const newAnalysis = await ConceptRootAnalysis.create({
        userId: user._id,
        latestAttemptId,
        sourceAttemptIds,
        targetConceptId,
        status: finalStatus,
        errorType: finalErrorType,
        rootConceptId: aiResponse.rootConceptId,
        alternativeConceptIds: aiResponse.alternativeConceptIds || [],
        explanation: aiResponse.explanation,
        recommendedDiagnostic: aiResponse.recommendedDiagnostic,
        confidence,
        evidenceHash,
        analysisVersion: "2.0"
      });

      learningDiagnosis = { ...newAnalysis.toObject(), hasDiagnosis: true };
    } else {
      learningDiagnosis = { hasDiagnosis: false };
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
        },
        learningDiagnosis,
      },
    });
  } catch (err) {
    if (err.message === "AI_SERVICE_UNAVAILABLE") {
      return res.status(503).json({
        success: false,
        error: "AI_SERVICE_UNAVAILABLE",
        message: "AI analysis is temporarily unavailable."
      });
    }
    console.error("[ConceptRoot] Error fetching ConceptRoot data:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to load your ConceptRoot analysis. Please try again.",
    });
  }
}

/**
 * POST /api/concept-root/analyze
 * Real-time AI diagnostic analysis for interactive ConceptRoot demo or student submission.
 */
export async function analyzeConceptRoot(req, res) {
  try {
    const { mode, question, userAnswer, code } = req.body;

    // A mock target concept and evidence for demo purposes since we don't have full assessment context here.
    const targetConceptId = "dsa.binary-search";
    const candidateRoots = getCandidateRoots(targetConceptId);
    const structuredEvidence = [
      {
        questionText: question || "Demo Question",
        userAnswer: mode === "code" ? code : userAnswer,
      }
    ];

    const aiResponse = await analyzeConceptRootWithAI(targetConceptId, candidateRoots, structuredEvidence);

    let finalStatus = aiResponse.status;
    let finalErrorType = aiResponse.errorType;
    if (!isValidStatus(finalStatus)) finalStatus = "insufficient_evidence";
    if (!isValidErrorType(finalErrorType)) finalErrorType = "unknown";

    const diagnosis = {
      status: finalStatus,
      errorType: finalErrorType,
      rootConceptId: aiResponse.rootConceptId,
      alternativeConceptIds: aiResponse.alternativeConceptIds || [],
      explanation: aiResponse.explanation,
      recommendedDiagnostic: aiResponse.recommendedDiagnostic,
      confidence: finalStatus === "diagnosed" ? calculateConfidence(1, finalErrorType) : 0,
      targetConceptId
    };

    return res.json({
      success: true,
      data: diagnosis,
    });
  } catch (err) {
    if (err.message === "AI_SERVICE_UNAVAILABLE") {
      return res.status(503).json({
        success: false,
        error: "AI_SERVICE_UNAVAILABLE",
        message: "AI analysis is temporarily unavailable."
      });
    }
    console.error("[ConceptRoot] Error running AI analysis:", err);
    return res.status(500).json({
      success: false,
      message: "AI diagnostic analysis failed: " + (err.message || "Please try again."),
    });
  }
}
