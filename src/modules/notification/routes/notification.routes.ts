import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";
import { ctrlNotificationController } from "../controllers/notification.controller";

const router: Router = Router();

// Post /api/hackit/ctrl/notification
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  ctrlNotificationController.createNotification
);

// Get /api/hackit/ctrl/notification
router.get(
  "/",
  verifyToken,
  checkRole(["admin"]),
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
  checkRole(["admin"]),
  ctrlNotificationController.updateNotification
);

// Delete /api/hackit/ctrl/notification/:id
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlNotificationController.deleteNotification
);

export default router;
