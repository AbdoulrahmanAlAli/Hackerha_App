import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type {
  AuthenticatedRequest,
  JwtPayloadUser,
} from "../../core/http/authenticatedRequest";
import { env } from "../../bootstrap/env";
import { unauthorized, badRequest } from "../errors/httpErrors";

export default function verifyToken(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

  if (!token) return next(unauthorized("Access denied. No token provided."));

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayloadUser;
    (req as AuthenticatedRequest).user = decoded;
    return next();
  } catch {
    return next(badRequest("Invalid token."));
  }
}
