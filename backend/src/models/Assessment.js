import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    concept: { type: String, trim: true, default: "" },
    question: { type: String, required: true, trim: true },
    context: { type: String, trim: true },
    codeSnippet: { type: String, trim: true, default: "" },
    options: [{ type: String, trim: true }],
    answer: mongoose.Schema.Types.Mixed,
    hints: [{ type: String, trim: true }],
    explanation: { type: String, trim: true, default: "" },
    rubric: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    field: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    careerGoals: [{ type: String, trim: true }],
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard", "Mixed"], default: "Mixed" },
    duration: { type: Number, required: true, min: 1 },
    icon: { type: String, default: "◆" },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    isAiGenerated: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    questions: { type: [questionSchema], validate: [(v) => v.length > 0, "At least one question is required"] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Assessment", assessmentSchema);
