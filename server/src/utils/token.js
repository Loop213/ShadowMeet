import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.refreshJwtSecret, { expiresIn: env.refreshJwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.refreshJwtSecret);
