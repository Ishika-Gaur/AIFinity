import mongoose from "mongoose";

const mistakeMapAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    aiInsights: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    analysisSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastGeneratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

mistakeMapAnalysisSchema.index({ userId: 1, createdAt: -1 });

const MistakeMapAnalysis = mongoose.model("MistakeMapAnalysis", mistakeMapAnalysisSchema);

export default MistakeMapAnalysis;
