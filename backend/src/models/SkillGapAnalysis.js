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
    careerGoal: {
      type: String,
      default: "",
    },
    calculationVersion: {
      type: String,
      default: "2B",
    },
    sourceAttemptCount: {
      type: Number,
      default: 0,
    },
    deterministicMetrics: {
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
    }
  },
  { timestamps: true }
);

const SkillGapAnalysis = mongoose.model("SkillGapAnalysis", skillGapAnalysisSchema);
export default SkillGapAnalysis;
