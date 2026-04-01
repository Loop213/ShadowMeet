import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    chatScope: {
      type: String,
      enum: ["global", "private", "session"],
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "gif", "sticker", "image"],
      default: "text",
    },
    content: { type: String, required: true },
    moderation: {
      flagged: { type: Boolean, default: false },
      reason: { type: String, default: null },
    },
    deliveredTo: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    seenBy: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ chatScope: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ sessionId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
