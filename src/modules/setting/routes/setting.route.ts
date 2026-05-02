import { Router } from "express";
import { settingController } from "../controllers/setting.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";

const router = Router();

// Reset students relations (Admin only)
router.patch(
  "/reset-students-relations",
  verifyToken,
  requireAdmin,
  settingController.resetStudentsRelations
);

// Get statistics (Admin only)
router.get(
  "/statistics",
  verifyToken,
  requireAdmin,
  settingController.getStatistics
);

export default router;