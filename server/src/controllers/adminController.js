import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import { Call } from "../models/Call.js";
import { ApiError } from "../utils/ApiError.js";
import { ChatSession } from "../models/ChatSession.js";
import { Report } from "../models/Report.js";

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find()
    .select("email randomUsername isBanned bannedReason role lastIp createdAt lastActiveAt isOnline")
    .sort({ createdAt: -1 });

  res.json({ users });
});

export const toggleBanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isBanned, bannedReason = "" } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isBanned = Boolean(isBanned);
  user.bannedReason = user.isBanned ? bannedReason : "";
  await user.save();

  res.json({ user });
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalMessages,
    flaggedMessages,
    totalCalls,
    activeSessions,
    reportsOpen,
    matchesPerMinute,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isOnline: true }),
    Message.countDocuments(),
    Message.countDocuments({ "moderation.flagged": true }),
    Call.countDocuments(),
    ChatSession.countDocuments({ status: "active" }),
    Report.countDocuments({ status: "open" }),
    ChatSession.countDocuments({ createdAt: { $gte: new Date(Date.now() - 60 * 1000) } }),
  ]);

  res.json({
    analytics: {
      totalUsers,
      activeUsers,
      totalMessages,
      flaggedMessages,
      totalCalls,
      activeSessions,
      reportsOpen,
      matchesPerMinute,
    },
  });
});

export const getChatLogs = asyncHandler(async (_req, res) => {
  const messages = await Message.find()
    .populate("senderId receiverId", "email randomUsername")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ messages });
});

export const getReports = asyncHandler(async (_req, res) => {
  const reports = await Report.find()
    .populate("reporterId reportedUserId", "email randomUsername")
    .populate("sessionId")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ reports });
});
