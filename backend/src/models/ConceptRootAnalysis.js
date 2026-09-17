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
    sourceAttemptIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttemptResult"
    }],
    targetConceptId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["diagnosed", "insufficient_evidence"],
      required: true,
    },
    errorType: {
      type: String,
    },
    rootConceptId: {
      type: String,
    },
    supportingEvidenceIds: [{
      type: String,
    }],
    alternativeConceptIds: [{
      type: String,
    }],
    explanation: {
      type: String,
    },
    recommendedDiagnostic: {
      type: String,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    analysisVersion: {
      type: String,
      default: "2.0",
    },
    evidenceHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ConceptRootAnalysis = mongoose.model("ConceptRootAnalysis", conceptRootAnalysisSchema);

export default ConceptRootAnalysis;
