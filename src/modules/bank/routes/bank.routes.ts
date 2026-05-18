import { Router } from "express";
import { bankController } from "../controllers/bank.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";
import { upload } from "../../../core/middlewares/upload.middleware";

const router = Router();

// Create (Admin) - مع رفع صورة
router.post(
  "/", 
  verifyToken, 
  requireAdmin, 
  upload, // middleware لرفع الصورة
  bankController.createBank
);

// Read
router.get("/", verifyToken, bankController.getAllBanks);
router.get("/stats", verifyToken, requireAdmin, bankController.getSystemStats);
router.get("/:id", verifyToken, bankController.getBankById);
router.get("/year/:year/semester/:semester", verifyToken, bankController.getBanksByYearAndSemester);

// Update (Admin) - مع إمكانية رفع صورة جديدة
router.put(
  "/:id", 
  verifyToken, 
  requireAdmin, 
  upload, // middleware لرفع الصورة (اختياري)
  bankController.updateBank
);

// Delete image (Admin)
router.delete(
  "/:id/image", 
  verifyToken, 
  requireAdmin, 
  bankController.deleteBankImage
);

// Delete (Admin)
router.delete("/:id", verifyToken, requireAdmin, bankController.deleteBank);

export default router;