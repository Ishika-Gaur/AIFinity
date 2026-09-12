import mongoose from "mongoose";

const skillGapAnalysisSchema = new mongoose.Schema(
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

skillGapAnalysisSchema.index({ userId: 1, createdAt: -1 });

const SkillGapAnalysis = mongoose.model("SkillGapAnalysis", skillGapAnalysisSchema);

export default SkillGapAnalysis;