import { Router } from "express";
import { bankController } from "../controllers/bank.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";
import { normalizeBankFormData } from "../../../core/middlewares/normalizeFormData";
import { upload } from "../../../core/middlewares/upload.middleware";

const router = Router();

// Routes للجميع (تتصرف حسب دور المستخدم)
router.get("/", verifyToken, bankController.getAllBanks);
router.get("/:id", verifyToken, bankController.getBankById);

// Routes للمشرفين فقط
router.post(
  "/", 
  verifyToken, 
  requireAdmin, 
  upload,
  normalizeBankFormData,
  bankController.createBank
);

router.put(
  "/:id", 
  verifyToken, 
  requireAdmin, 
  upload,
  normalizeBankFormData,
  bankController.updateBank
);

router.delete(
  "/:id/image", 
  verifyToken, 
  requireAdmin, 
  bankController.deleteBankImage
);

router.delete("/:id", verifyToken, requireAdmin, bankController.deleteBank);

// إحصائيات (للمشرفين فقط)
router.get("/stats", verifyToken, requireAdmin, bankController.getSystemStats);

export default router;