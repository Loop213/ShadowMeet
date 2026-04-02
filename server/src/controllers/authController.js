import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { signRefreshToken, signToken, verifyRefreshToken } from "../utils/token.js";
import { buildCandidateUsername } from "../utils/generateUsername.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../services/mailerService.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  email: user.email || null,
  randomUsername: user.randomUsername,
  avatarUrl: user.avatarUrl,
  anonymousAvatar: user.anonymousAvatar,
  bio: user.bio,
  interests: user.interests,
  isGuest: user.isGuest,
  preferredLanguage: user.preferredLanguage,
  gender: user.gender,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
  role: user.role,
  createdAt: user.createdAt,
});

const generateUniqueUsername = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = buildCandidateUsername();
    const exists = await User.exists({ randomUsername: candidate });
    if (!exists) {
      return candidate;
    }
  }

  throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Unable to generate username");
};

const buildAuthPayload = (user) => {
  const token = signToken({ userId: user._id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id, role: user.role });
  return { token, refreshToken, user: sanitizeUser(user) };
};

const issueAuthResponse = async (user, res) => {
  const payload = buildAuthPayload(user);
  user.refreshToken = payload.refreshToken;
  await user.save();
  res.json(payload);
};

export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email and password are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already in use");
  }

  const randomUsername = await generateUniqueUsername();
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    randomUsername,
    isGuest: false,
    anonymousAvatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${randomUsername}`,
    lastIp: req.ip,
    lastSeen: new Date(),
    lastActiveAt: new Date(),
  });

  await issueAuthResponse(user, res.status(StatusCodes.CREATED));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  if (user.isBanned) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account is banned");
  }

  user.lastIp = req.ip;
  user.lastSeen = new Date();
  user.lastActiveAt = new Date();
  await user.save();

  await issueAuthResponse(user, res);
});

export const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required");
  }

  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      randomUsername: await generateUniqueUsername(),
      isGuest: false,
      anonymousAvatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${normalizedEmail}`,
      lastIp: req.ip,
    });
  }

  const otp = generateOtp();
  user.otpCodeHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendOtpEmail({ email: normalizedEmail, otp });

  res.json({ message: "OTP sent successfully" });
});

export const verifyOtpLogin = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  if (!user || !user.otpCodeHash || !user.otpExpiresAt) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "OTP login not initiated");
  }

  const isValid = user.otpCodeHash === hashOtp(otp) && user.otpExpiresAt > new Date();
  if (!isValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired OTP");
  }

  user.otpCodeHash = undefined;
  user.otpExpiresAt = undefined;
  user.lastSeen = new Date();
  user.lastActiveAt = new Date();
  await user.save();

  await issueAuthResponse(user, res);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export const guestLogin = asyncHandler(async (req, res) => {
  const { interests = [], preferredLanguage = "en", gender = "" } = req.body || {};
  const randomUsername = await generateUniqueUsername();
  const user = await User.create({
    randomUsername,
    isGuest: true,
    interests,
    preferredLanguage,
    gender,
    anonymousAvatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${randomUsername}`,
    lastIp: req.ip,
    lastSeen: new Date(),
    lastActiveAt: new Date(),
  });

  await issueAuthResponse(user, res.status(StatusCodes.CREATED));
});

export const refreshSession = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token no longer valid");
  }

  if (user.isBanned) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account is banned");
  }

  user.lastSeen = new Date();
  user.lastActiveAt = new Date();
  await issueAuthResponse(user, res);
});

export const logoutSession = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  }

  res.json({ message: "Logged out" });
});
