import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    randomUsername: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 8,
    },
    avatarUrl: String,
    anonymousAvatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 280,
    },
    interests: {
      type: [String],
      default: [],
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    blockedUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    preferredLanguage: {
      type: String,
      default: "en",
    },
    gender: {
      type: String,
      enum: ["male", "female", "nonbinary", "prefer_not_to_say", ""],
      default: "",
    },
    lastSeen: Date,
    lastActiveAt: Date,
    isOnline: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedReason: String,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    lastIp: String,
    otpCodeHash: String,
    otpExpiresAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model("User", userSchema);
