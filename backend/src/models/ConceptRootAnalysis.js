import mongoose from "mongoose";

const conceptRootAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

conceptRootAnalysisSchema.index({ userId: 1, createdAt: -1 });

const ConceptRootAnalysis = mongoose.model("ConceptRootAnalysis", conceptRootAnalysisSchema);

export default ConceptRootAnalysis;