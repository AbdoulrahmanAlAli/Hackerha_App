import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";
import { ctrlSessionController } from "../controllers/session.controller";

const router = Router();

// Admin CRUD
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  ctrlSessionController.createSession
);
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlSessionController.updateSession
);
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlSessionController.deleteSession
);

// Public read
router.get("/:id", verifyToken, ctrlSessionController.getSessionById);
router.get(
  "/courses/:courseId",
  verifyToken,
  ctrlSessionController.getSessionsByCourseId
);

// Student interactions
router.put(
  "/:id/like",
  verifyToken,
  checkRole(["student"]),
  ctrlSessionController.likeSession
);
router.put(
  "/:id/dislike",
  verifyToken,
  checkRole(["student"]),
  ctrlSessionController.dislikeSession
);

export default router;
