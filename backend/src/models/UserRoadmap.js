import mongoose from "mongoose";

const stageSchema = new mongoose.Schema({
  id: { type: Number },
  title: { type: String, required: true },
  phase: { type: String },
  status: { type: String, enum: ["locked", "current", "completed"], default: "locked" },
  duration: { type: String },
  priority: { type: String, default: "Standard" },
  why: { type: String },
  progress: { type: Number, default: 0 },
  concepts: [{ type: String }],
  description: { type: String },
  learningTasks: [{ type: String }],
  practiceTasks: [{ type: String }],
  questions: { type: Number, default: 0 },
  isWeakConcept: { type: Boolean, default: false },
});

const userRoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    targetCareer: { type: String, default: "" },
    selectedField: { type: String, default: "" },
    readinessScore: { type: Number, default: 0 },
    hasHistory: { type: Boolean, default: false },
    completedStageIds: [{ type: Number }],
    stages: [stageSchema],
    lastEvaluatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const UserRoadmap = mongoose.model("UserRoadmap", userRoadmapSchema);

export default UserRoadmap;
