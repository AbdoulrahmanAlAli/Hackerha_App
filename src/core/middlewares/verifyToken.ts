import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type {
  AuthenticatedRequest,
  JwtPayloadUser,
} from "../../core/http/authenticatedRequest";
import { env } from "../../bootstrap/env";
import { unauthorized, badRequest, forbidden } from "../errors/httpErrors";
import { Student } from "../../modules/users/student/models/student.model";

export default async function verifyToken(
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
    
     // Check student specific validations
    if (decoded.role === 'student') {
      const student = await Student.findById(decoded.id).select("available suspended");
      
      if (!student) {
        return next(badRequest("الطالب غير موجود"));
      }

      // Fix: Check if account is NOT available (blocked/hidden)
      if (!student.available) {
        return next(forbidden("الحساب غير مفعل، يرجى التواصل مع الدعم الفني"));
      }

      // Check if account is suspended
      if (student.suspended) {
        return next(forbidden("حسابك مقيد حالياً. يرجى التواصل مع الدعم الفني"));
      }
    }

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(unauthorized("Token has expired. Please login again."));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(badRequest("Invalid token."));
    }
      return next(badRequest("Authentication failed."));
  }
}
