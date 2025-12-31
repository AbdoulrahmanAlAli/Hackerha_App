import type { RequestHandler } from "express";
import { notFound } from "../errors/httpErrors";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
