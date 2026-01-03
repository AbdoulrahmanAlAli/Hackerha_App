import type { RequestHandler } from "express";
import { logger } from "../../bootstrap/logger";

export const performanceMiddleware: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    logger.info(
      `${req.method} ${req.originalUrl} - ${durationMs.toFixed(2)} ms`
    );
  });

  next();
};
