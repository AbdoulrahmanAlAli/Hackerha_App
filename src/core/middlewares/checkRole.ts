import type { NextFunction, RequestHandler } from "express";
import type { AuthenticatedRequest, UserRole } from "../http/authenticatedRequest";
import { forbidden } from "../errors/httpErrors";

export const checkRole = (allowedRoles: UserRole[]): RequestHandler => {
  return (req, _res, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !allowedRoles.includes(user.role)) {
      return next(forbidden("Access denied. Insufficient permissions."));
    }

    return next();
  };
};

export default checkRole;
