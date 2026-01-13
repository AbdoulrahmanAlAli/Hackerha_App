import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";
import { ctrlSessionController } from "../controllers/session.controller";

const router = Router();

// POST /api/hackit/ctrl/sessions  (Admin)
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  ctrlSessionController.createSession
);

// PUT /api/hackit/ctrl/sessions/:id  (Admin)
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlSessionController.updateSession
);

// DELETE /api/hackit/ctrl/sessions/:id  (Admin)
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlSessionController.deleteSession
);

// GET /api/hackit/ctrl/sessions/:id  (Public, optional userId for video token binding)
router.get("/:id", verifyToken, ctrlSessionController.getSessionById);

// GET /api/hackit/ctrl/sessions/course/:courseId  (Public)
router.get(
  "/courses/:courseId",
  verifyToken,
  ctrlSessionController.getSessionsByCourseId
);

// PUT /api/hackit/ctrl/sessions/:id/like  (Student)
router.put(
  "/:id/like",
  verifyToken,
  checkRole(["student"]),
  ctrlSessionController.likeSession
);

// PUT /api/hackit/ctrl/sessions/:id/dislike  (Student)
router.put(
  "/:id/dislike",
  verifyToken,
  checkRole(["student"]),
  ctrlSessionController.dislikeSession
);

export default router;
