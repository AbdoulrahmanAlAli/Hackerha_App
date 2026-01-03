import type { RequestHandler } from "express";
import { unauthorized } from "../errors/httpErrors";
import { verifyAccessToken } from "../../shared/security/jwt";

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(unauthorized("غير مصرح"));
  }

  const token = header.slice(7).trim();
  const payload = verifyAccessToken(token);

  req.user = {
    id: payload.id,
    role: payload.role,
  };

  next();
};
