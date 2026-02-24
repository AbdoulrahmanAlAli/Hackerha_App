import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import { ctrlNotificationController } from "../controllers/notification.controller";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";

const router: Router = Router();

// Post /api/hackit/ctrl/notification
router.post(
  "/",
  verifyToken,
  requireAdmin,
  ctrlNotificationController.createNotification
);

// Get /api/hackit/ctrl/notification
router.get(
  "/",
  verifyToken,
  requireAdmin,
  ctrlNotificationController.getAllNotifications
);

// Get /api/hackit/notification/student/:studentId
router.get(
  "/student/:studentId",
  verifyToken,
  ctrlNotificationController.getNotificationsByStudentId
);

// Get /api/hackit/ctrl/notification/:id
router.get("/:id", verifyToken, ctrlNotificationController.getNotificationById);

// Put /api/hackit/ctrl/notification/:id
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  ctrlNotificationController.updateNotification
);

// Delete /api/hackit/ctrl/notification/:id
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  ctrlNotificationController.deleteNotification
);

export default router;
