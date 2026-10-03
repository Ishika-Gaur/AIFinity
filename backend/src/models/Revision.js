import mongoose from "mongoose";

/**
 * Revision
 * Stores the spaced repetition state and cached AI content for concepts.
 * Recommending a concept for revision is derived dynamically from AttemptResult,
 * but this model tracks the *schedule* and *session history* of that revision.
 */
const revisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conceptId: {
      type: String,
      required: true,
    },
    conceptName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["DUE", "NOT_DUE"],
      default: "DUE",
    },
    revisionCount: {
      type: Number,
      default: 0,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    nextReviewAt: {
      type: Date,
      default: null,
      index: true, // Useful for querying 'due' items
    },
    // Used to track spaced repetition progression
    intervalDays: {
      type: Number,
      default: 0, 
    },
    // Cache for AI generated revision content to avoid repeated calls
    aiContent: {
      contentVersion: { type: String, default: "1.0" },
      evidenceHash: { type: String, default: null }, // Helps invalidate stale content if weakness changes
      generatedAt: { type: Date, default: null },
      content: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    }
  },
  { timestamps: true }
);

// A user should only have one revision tracker per concept
revisionSchema.index({ userId: 1, conceptId: 1 }, { unique: true });

const Revision = mongoose.model("Revision", revisionSchema);

export default Revision;
