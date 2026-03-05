import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";
import { ctrlReorderController } from "../controllers/reorder.controller";

const router: Router = Router();

// POST /api/hackit/ctrl/reorder/:courseId
router.post(
  "/:courseId",
  verifyToken,
  requireAdmin,
  ctrlReorderController.reorderContent,
);

export default router;
