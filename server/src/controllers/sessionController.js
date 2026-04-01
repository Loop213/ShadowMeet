import { asyncHandler } from "../utils/asyncHandler.js";
import { ChatSession } from "../models/ChatSession.js";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";

export const getMatchHistory = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({
    $or: [{ user1: req.user._id }, { user2: req.user._id }],
  })
    .populate("user1 user2", "randomUsername anonymousAvatar")
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({ sessions });
});

export const reportUser = asyncHandler(async (req, res) => {
  const { reportedUserId, sessionId, reason = "other", notes = "" } = req.body;

  const report = await Report.create({
    reporterId: req.user._id,
    reportedUserId,
    sessionId,
    reason,
    notes,
  });

  const openReports = await Report.countDocuments({ reportedUserId, status: "open" });
  if (openReports >= 3) {
    await User.findByIdAndUpdate(reportedUserId, {
      isBanned: true,
      bannedReason: "Auto-banned after repeated reports",
    });
  }

  res.status(201).json({ report });
});
