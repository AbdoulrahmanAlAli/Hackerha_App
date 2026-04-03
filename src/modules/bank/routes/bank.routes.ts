import { Router } from "express";
import { bankController } from "../controllers/bank.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";

const router = Router();

// إنشاء بنك جديد - فقط Admin
router.post("/", verifyToken, requireAdmin, bankController.createBank);

// جلب كل البنوك
router.get("/", verifyToken, bankController.getAllBanks);

// جلب بنك واحد بواسطة id
router.get("/:id", verifyToken, bankController.getBankById);

// تحديث بنك - فقط Admin
router.put("/:id", verifyToken, requireAdmin, bankController.updateBank);

// حذف بنك - فقط Admin
// router.delete("/:id", verifyToken, requireAdmin, bankController.deleteBank);

export default router;