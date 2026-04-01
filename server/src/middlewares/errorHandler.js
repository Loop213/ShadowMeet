import { StatusCodes } from "http-status-codes";

export const notFound = (_req, _res, next) => {
  const error = new Error("Route not found");
  error.statusCode = StatusCodes.NOT_FOUND;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    message: error.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

