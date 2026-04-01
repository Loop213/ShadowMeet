import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    user1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    user2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: {
      type: String,
      enum: ["text", "voice", "video"],
      default: "text",
    },
    matchedInterests: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "ended", "skipped", "disconnected", "reported"],
      default: "active",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    endedReason: String,
  },
  { timestamps: true }
);

chatSessionSchema.index({ user1: 1, user2: 1, status: 1 });

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

