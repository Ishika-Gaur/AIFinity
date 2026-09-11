import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  skillId: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"], default: "NOT_STARTED" },
  priority: { type: String, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
  why: { type: String },
  prerequisites: [{ type: String }],
  learningTasks: [{ type: String }],
  practiceTasks: [{ type: String }],
  projectTasks: [{ type: String }],
  validation: [{ type: String }],
  estimatedHours: { type: Number, default: 0 },
  dependencies: [{ type: String }],
  completionCriteria: [{ type: String }],
  progress: { type: Number, default: 0 }
});

const phaseSchema = new mongoose.Schema({
  phaseId: { type: String },
  title: { type: String, required: true },
  objective: { type: String },
  priority: { type: String, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
  estimatedDuration: { type: String },
  skills: [skillSchema]
});

const shortRoadmapSchema = new mongoose.Schema({
  currentFocus: { type: String },
  nextSteps: [{ type: String }],
  thisWeek: [{ type: String }],
  nextMilestone: { type: String }
}, { _id: false });

const userRoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    schemaVersion: { type: Number, default: 2 },
    careerGoal: { type: String, default: "" },
    targetRole: { type: String, default: "" },
    currentLevel: { type: String, default: "" },
    roadmapTitle: { type: String, default: "Personalized AI Learning Roadmap" },
    summary: { type: String, default: "" },
    estimatedDuration: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    phases: [phaseSchema],
    shortRoadmap: shortRoadmapSchema,
    evidenceSnapshot: {
      assessmentCount: { type: Number, default: 0 },
      lastAttemptId: { type: String, default: "" }
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE"
    },
  },
  {
    timestamps: true,
  }
);

const UserRoadmap = mongoose.model("UserRoadmap", userRoadmapSchema);

export default UserRoadmap;
