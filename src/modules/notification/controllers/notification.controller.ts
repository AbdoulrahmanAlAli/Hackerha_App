import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlNotificationService } from "../services/notification.service";
import { AuthenticatedRequest } from "../../../core/http/authenticatedRequest";
import { notFound } from "../../../core/errors/httpErrors";

class CtrlNotificationController {
  // POST /api/hackit/ctrl/notification
  createNotification = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlNotificationService.createNotification(req.body);
    res.status(201).json(result);
  });

  // GET /api/hackit/notification/student/:studentId
  getNotificationsByStudentId = asyncHandler(
    async (req: Request, res: Response) => {
      const { studentId } = req.params;

      const notifications =
        await CtrlNotificationService.getNotificationsByStudentId(studentId);

      res.status(200).json(notifications);
    }
  );

  // GET /api/hackit/ctrl/notification/:id
  getNotificationById = asyncHandler(async (req: Request, res: Response) => {
    const notification = await CtrlNotificationService.getNotificationById(
      req.params.id
    );

    res.status(200).json(notification);
  });

  // GET /api/hackit/ctrl/notification
  getAllNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await CtrlNotificationService.getAllNotifications();

    res.status(200).json(notifications);
  });

  // PUT /api/hackit/ctrl/notification/:id
  updateNotification = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlNotificationService.updateNotification(
      req.params.id,
      req.body
    );

    res.status(200).json(result);
  });

  // DELETE /api/hackit/ctrl/notification/:id
  deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw notFound("لا يوجد مستخدم");

    const result = await CtrlNotificationService.deleteNotification(
      req.params.id,
      user.id
    );

    res.status(200).json(result);
  });
}

export const ctrlNotificationController = new CtrlNotificationController();
