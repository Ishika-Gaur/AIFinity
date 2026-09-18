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
      default: "3A",
    },
    deterministicRoot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    aiInsights: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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