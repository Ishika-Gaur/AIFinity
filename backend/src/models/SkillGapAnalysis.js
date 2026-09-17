import mongoose from "mongoose";

const skillGapAnalysisSchema = new mongoose.Schema(
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
  { timestamps: true }
);

const SkillGapAnalysis = mongoose.model("SkillGapAnalysis", skillGapAnalysisSchema);
export default SkillGapAnalysis;
