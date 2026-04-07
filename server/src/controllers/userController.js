import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export const getDiscoverUsers = asyncHandler(async (req, res) => {
  const users = await User.aggregate([
    {
      $match: {
        _id: { $ne: req.user._id },
        isBanned: false,
      },
    },
    { $sample: { size: 20 } },
    {
      $project: {
        email: 0,
        password: 0,
        otpCodeHash: 0,
        lastIp: 0,
      },
    },
  ]);

  res.json({ users });
});

export const getOnlineUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({
    _id: { $ne: _req.user._id },
    isOnline: true,
    isBanned: false,
  })
    .select("randomUsername avatarUrl anonymousAvatar bio lastSeen isOnline interests")
    .sort({ lastActiveAt: -1 })
    .limit(50)
    .lean();

  res.json({
    users: users.map((user) => ({
      ...user,
      status: user.isOnline ? "online" : "offline",
    })),
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { bio = "", interests = [], avatarUrl = "" } = req.body;

  if (bio.length > 280) {
    throw new ApiError(400, "Bio must be 280 characters or less");
  }

  req.user.bio = bio;
  req.user.avatarUrl = avatarUrl;
  req.user.interests = Array.isArray(interests)
    ? interests.map((item) => `${item}`.trim()).filter(Boolean).slice(0, 8)
    : [];

  await req.user.save();

  res.json({
    user: {
      _id: req.user._id,
      email: req.user.email,
      randomUsername: req.user.randomUsername,
      avatarUrl: req.user.avatarUrl,
      bio: req.user.bio,
      interests: req.user.interests,
      isOnline: req.user.isOnline,
      lastSeen: req.user.lastSeen,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
});
