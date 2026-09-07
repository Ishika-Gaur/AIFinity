import mongoose from "mongoose";

/**
 * AttemptResult
 * Persists every completed assessment submission for a user.
 * This is the single source of truth for all dynamic AI modules & analytics
 * (SkillGap, MistakeMap, ConceptRoot, Roadmap, Dashboard).
 */
const questionResultSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  type: { type: String, default: "mcq" },
  userAnswer: { type: String, default: null },
  correctAnswer: { type: String, default: "" },
  status: { type: String, enum: ["correct", "partial", "incorrect", "unanswered"], default: "incorrect" },
  isCorrect: { type: Boolean, default: false },
  marksAwarded: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 10 },
  explanation: { type: String, default: "" },
  concept: { type: String, default: "" },
  aiScore: { type: Number, default: null },
  aiFeedback: { type: String, default: "" },
  keyPointsMissed: [{ type: String }],
});

const attemptResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: false,
    },
    assessmentTitle: {
      type: String,
      required: true,
      trim: true,
    },
    assessmentCategory: {
      type: String,
      required: true,
      trim: true,
    },
    assessmentField: {
      type: String,
      trim: true,
      default: "",
    },
    scorePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    attemptedCount: {
      type: Number,
      default: 0,
    },
    gradableCount: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    elapsedSeconds: {
      type: Number,
      default: 0,
    },
    evaluatedByAI: {
      type: Boolean,
      default: false,
    },
    overallFeedback: {
      type: String,
      default: "",
    },
    overallRating: {
      type: String,
      default: "",
    },
    strengths: [{ type: String }],
    areasToImprove: [{ type: String }],
    violations: [
      {
        reason: { type: String },
        timestamp: { type: String },
      },
    ],
    questionResults: [questionResultSchema],
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: efficiently fetch all attempts for a user sorted by date
attemptResultSchema.index({ userId: 1, completedAt: -1 });

const AttemptResult = mongoose.model("AttemptResult", attemptResultSchema);

export default AttemptResult;
