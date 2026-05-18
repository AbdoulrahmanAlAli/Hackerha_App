import { Router } from "express";
import { bankExamController } from "../controllers/bank-exam.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";

const router = Router();

// Create (Admin)
router.post("/", verifyToken, requireAdmin, bankExamController.createBankExam);

// Read
router.get("/:id", verifyToken, bankExamController.getBankExamById);
router.get("/bank/:bankId", verifyToken, bankExamController.getBankExamsByBankId);

// Update (Admin)
router.put("/:id", verifyToken, requireAdmin, bankExamController.updateBankExam);

// Delete (Admin)
router.delete("/:id", verifyToken, requireAdmin, bankExamController.deleteBankExam);

export default router;