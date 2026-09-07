import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for querying user messages ordered by creation time
ChatMessageSchema.index({ userId: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", ChatMessageSchema);
