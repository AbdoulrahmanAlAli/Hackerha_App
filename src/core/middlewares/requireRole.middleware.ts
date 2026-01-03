import type { RequestHandler } from "express";
import { badRequest, forbidden, unauthorized } from "../errors/httpErrors";
import { AuthenticatedRequest } from "../http/authenticatedRequest";

// admin only
export const requireAdmin: RequestHandler = (req, _res, next) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "admin") throw forbidden("غير مصرح لك");
  next();
};

// owner only (teacher نفسه) - يعتمد على req.params.id
export const requireTeacherOwner =
  (paramName: string = "id"): RequestHandler =>
  (req, _res, next) => {
    const user = (req as AuthenticatedRequest).user;
    const targetId = req.params[paramName];

    if (!targetId) throw badRequest("معرف غير موجود في الرابط");
    if (!user || user.role !== "teacher" || user.id !== targetId) {
      throw forbidden("غير مصرح لك");
    }
    next();
  };

// owner only (student نفسه) - يعتمد على req.params.id
export const requireStudentOwner =
  (paramName: string = "id"): RequestHandler =>
  (req, _res, next) => {
    const user = (req as AuthenticatedRequest).user;
    const targetId = req.params[paramName];
    if (!targetId) throw badRequest("معرف غير موجود في الرابط");
    if (!user || user.role !== "student" || user.id !== targetId) {
      throw forbidden("غير مصرح لك");
    }

    next();
  };
