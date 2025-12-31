import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { logger } from "../../bootstrap/logger";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  logger.error("Unhandled error", err);
  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
};
