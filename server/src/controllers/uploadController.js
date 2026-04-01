import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

export const getCloudinarySignature = asyncHandler(async (_req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = "dating-app/messages";
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${env.cloudinary.apiSecret}`)
    .digest("hex");

  res.json({
    timestamp,
    signature,
    folder,
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
  });
});

export const getGiphyConfig = asyncHandler(async (_req, res) => {
  res.json({ apiKey: env.giphyApiKey });
});

