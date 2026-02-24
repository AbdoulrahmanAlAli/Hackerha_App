import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import { ctrlPaymentController } from "../controllers/payment.controller";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";

const router: Router = Router();

// POST /api/hackit/payment/code
router.post(
  "/code",
  verifyToken,
  requireAdmin,
  ctrlPaymentController.generatePaymentCode,
);

// POST /api/hackit/payment/verify
router.post("/verify", verifyToken, ctrlPaymentController.verifyPaymentCode);

// GET /api/hackit/payment/codes
router.get(
  "/codes",
  verifyToken,
  requireAdmin,
  ctrlPaymentController.getAllPaymentCodes,
);

// GET /api/hackit/payment/codes/:universityNumber
router.get(
  "/codes/:universityNumber",
  verifyToken,
  ctrlPaymentController.getStudentPaymentCodes,
);

export default router;
