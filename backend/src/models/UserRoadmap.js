import mongoose from "mongoose";

const stageSchema = new mongoose.Schema({
  id: { type: Number },
  title: { type: String, required: true },
  phase: { type: String },
  status: { type: String, enum: ["locked", "current", "completed", "upcoming"], default: "locked" },
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
      index: true,
    },
    courseId: {
      type: String,
      required: true,
      default: "default",
      trim: true,
      index: true,
    },
    targetCareer: { type: String, default: "" },
    selectedField: { type: String, default: "" },
    readinessScore: { type: Number, default: 0 },
    hasHistory: { type: Boolean, default: false },
    completedStageIds: [{ type: Number }],
    stages: [stageSchema],

    // State-tracking attributes for progress resumption ("Pick Up Where You Left Off")
    currentNodeIndex: { type: Number, default: 0 },
    currentTopic: { type: String, default: "" },
    completedTopics: [{ type: String }],
    lastAccessed: { type: Date, default: Date.now },
    activeStageId: { type: Number, default: 1 },

    lastEvaluatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Objective 2: Compound unique index combining userId and courseId
// Enables concurrent multi-course roadmap persistence without cross-contamination
userRoadmapSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserRoadmap = mongoose.model("UserRoadmap", userRoadmapSchema);

export default UserRoadmap;
