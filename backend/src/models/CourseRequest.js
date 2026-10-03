import mongoose from "mongoose";

const courseRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      maxlength: [200, "Course name cannot exceed 200 characters"],
    },
    provider: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Provider name cannot exceed 200 characters"],
    },
    referenceUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Reference URL cannot exceed 1000 characters"],
    },
    reason: {
      type: String,
      required: [true, "Reason for requesting the course is required"],
      trim: true,
      maxlength: [3000, "Reason cannot exceed 3000 characters"],
    },
    additionalDetails: {
      type: String,
      default: "",
      trim: true,
      maxlength: [3000, "Additional details cannot exceed 3000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "reviewing", "completed", "rejected"],
        message: "Status must be pending, reviewing, completed, or rejected",
      },
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's recent course requests efficiently
courseRequestSchema.index({ userId: 1, courseName: 1, createdAt: -1 });
courseRequestSchema.index({ createdAt: -1 });

const CourseRequest = mongoose.model("CourseRequest", courseRequestSchema);

export default CourseRequest;
