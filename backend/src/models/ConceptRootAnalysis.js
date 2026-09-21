import mongoose from "mongoose";

const conceptRootAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    latestAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttemptResult",
      required: true,
    },
    calculationVersion: {
      type: String,
      default: "3B", // Upgraded version to bypass old caches
    },
    deterministicRoot: {
      hasData: { type: Boolean, required: true },
      conceptId: { type: String, default: null },
      canonicalConcept: { type: String, default: null },
      skillId: { type: String, default: null },
      mastery: {
        attempts: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        recentAccuracy: { type: Number, default: 0 },
        edgeCaseAccuracy: { type: Number, default: null },
        trend: { type: String, default: "INSUFFICIENT_DATA" },
      },
      rootCause: {
        type: { type: String, default: "UNKNOWN" }, // Using reserved field name 'type' inside an object is ok in subdocuments if defined properly, but wait Mongoose might complain. Let's use { type: String } by doing type: { type: String }
        confidence: { type: Number, default: 0 },
        evidenceCount: { type: Number, default: 0 },
        rootConceptId: { type: String, default: null },
        rootConceptName: { type: String, default: null },
      },
      evidence: [{
        questionId: String,
        attemptId: String,
        canonicalConcept: String,
        skillId: String,
        isCorrect: Boolean,
        studentAnswer: String,
        correctAnswer: String,
        errorType: String,
        timestamp: Date,
        isEdgeCase: Boolean,
        difficulty: String
      }],
      dependencies: [{
        id: String,
        name: String,
        type: String,
        level: Number
      }],
      diagnosis: {
        status: { type: String, default: "INSUFFICIENT_EVIDENCE" }
      },
      sourceAttemptCount: { type: Number, default: 0 }
    },
    aiInsights: {
      explanation: { type: String, default: null }, // WHAT concept was involved / WHAT is correct conceptual understanding
      whyMistakeHappens: { type: String, default: null }, // WHERE/WHY did learner go wrong
      misconception: { type: String, default: null }, // WHAT type of mistake / WHAT prerequisite was weak
      conceptRelationship: { type: String, default: null },
      whatToUnderstand: [{ type: String }], // WHAT should the learner understand now
      mentalModel: { type: String, default: null }, // HOW to think about it next time
      howToAvoid: [{ type: String }], // HOW can the learner avoid repeating it
      recommendedRevision: [{ type: String }], // legacy/fallback
      recommendedPractice: [{ type: String }], // WHAT to practice
      confidenceNote: { type: String, default: null }
    },
    aiStatus: {
      type: String,
      enum: ["completed", "unavailable", "pending"],
      default: "completed",
    },
  },
  { timestamps: true }
);

conceptRootAnalysisSchema.index({ userId: 1, createdAt: -1 });

const ConceptRootAnalysis = mongoose.model("ConceptRootAnalysis", conceptRootAnalysisSchema);

export default ConceptRootAnalysis;