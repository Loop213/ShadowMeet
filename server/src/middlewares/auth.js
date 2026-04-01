import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { verifyToken } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";

export const protect = async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"));
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password -otpCodeHash");

    if (!user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token"));
    }

    if (user.isBanned) {
      return next(new ApiError(StatusCodes.FORBIDDEN, "Account is banned"));
    }

    req.user = user;
    next();
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token"));
  }
};

export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    return next(new ApiError(StatusCodes.FORBIDDEN, "Admin access required"));
  }
  next();
};

