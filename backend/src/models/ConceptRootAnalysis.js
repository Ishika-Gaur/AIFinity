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
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ConceptRootAnalysis = mongoose.model("ConceptRootAnalysis", conceptRootAnalysisSchema);

export default ConceptRootAnalysis;
