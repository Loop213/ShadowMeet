import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Message } from "../models/Message.js";
import { moderateContent } from "../services/moderationService.js";

export const getGlobalMessages = asyncHandler(async (_req, res) => {
  const messages = await Message.find({ chatScope: "global" })
    .populate("senderId", "randomUsername avatarUrl isOnline")
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ messages: messages.reverse() });
});

export const getPrivateMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const messages = await Message.find({
    chatScope: "private",
    $or: [
      { senderId: req.user._id, receiverId: userId },
      { senderId: userId, receiverId: req.user._id },
    ],
  })
    .populate("senderId", "randomUsername avatarUrl isOnline")
    .sort({ createdAt: 1 })
    .limit(200);

  res.json({ messages });
});

export const createMessage = asyncHandler(async (req, res) => {
  const { receiverId = null, chatScope, messageType = "text", content } = req.body;

  if (!content || !chatScope) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "chatScope and content are required");
  }

  if (chatScope === "private" && !receiverId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "receiverId is required for private chat");
  }

  const moderation = moderateContent(content);
  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    chatScope,
    messageType,
    content,
    moderation,
    deliveredTo: [req.user._id],
    seenBy: [req.user._id],
  });

  const populated = await message.populate("senderId", "randomUsername avatarUrl isOnline");
  res.status(StatusCodes.CREATED).json({ message: populated });
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  message.reactions = message.reactions.filter(
    (reaction) => `${reaction.userId}` !== `${req.user._id}`
  );

  if (emoji) {
    message.reactions.push({ userId: req.user._id, emoji });
  }

  await message.save();
  res.json({ message });
});

