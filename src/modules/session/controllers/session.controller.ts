import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlSessionService } from "../services/session.service";
import { AuthenticatedRequest } from "../../../core/http/authenticatedRequest";
import { badRequest } from "../../../core/errors/httpErrors";

class CtrlSessionController {
  // POST /api/hackit/ctrl/sessions  (Admin)
  createSession = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlSessionService.createSession(req.body);
    res.status(201).json(result);
  });

  // GET /api/hackit/ctrl/sessions/:id  (Public, optional userId for video token binding)
  getSessionById = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const session = await CtrlSessionService.getSessionById(req.params.id, userId);
    res.status(200).json(session);
  });

  // GET /api/hackit/ctrl/sessions/course/:courseId  (Public)
  getSessionsByCourseId = asyncHandler(async (req: Request, res: Response) => {
    // Get user role from authenticated request
    const userRole = (req as AuthenticatedRequest).user?.role;
    
    if (!userRole) {
      throw badRequest("دور المستخدم غير محدد");
    }
  
    const sessions = await CtrlSessionService.getSessionsByCourseId(
      req.params.courseId,
      userRole
    );
    
    res.status(200).json(sessions);
});

  // PUT /api/hackit/ctrl/sessions/:id  (Admin)
  updateSession = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlSessionService.updateSession(req.params.id, req.body);
    res.status(200).json(result);
  });

  // DELETE /api/hackit/ctrl/sessions/:id  (Admin)
  deleteSession = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlSessionService.deleteSession(req.params.id);
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/sessions/:id/like  (Student)
  likeSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id; // موجود لأن verifyToken + checkRole
    const result = await CtrlSessionService.likeSession(req.params.id, userId);
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/sessions/:id/dislike  (Student)
  dislikeSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const result = await CtrlSessionService.dislikeSession(req.params.id, userId);
    res.status(200).json(result);
  });
}

export const ctrlSessionController = new CtrlSessionController();
