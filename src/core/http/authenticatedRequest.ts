import type { Request } from "express";

export type UserRole = "admin" | "student" | "teacher";

export interface JwtPayloadUser {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadUser;
}
