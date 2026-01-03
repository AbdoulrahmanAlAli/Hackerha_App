import { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/httpErrors";
import { logger } from "../../bootstrap/logger";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // لو الخطأ من نوع HttpError
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // أخطاء غير متوقعة
  logger.error("Unhandled error", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
