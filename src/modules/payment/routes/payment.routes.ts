import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";
import { ctrlPaymentController } from "../controllers/payment.controller";

const router: Router = Router();

// POST /api/hackit/payment/code
router.post(
  "/code",
  verifyToken,
  checkRole(["admin"]),
  ctrlPaymentController.generatePaymentCode,
);

// POST /api/hackit/payment/verify
router.post("/verify", verifyToken, ctrlPaymentController.verifyPaymentCode);

// GET /api/hackit/payment/codes
router.get(
  "/codes",
  verifyToken,
  checkRole(["admin"]),
  ctrlPaymentController.getAllPaymentCodes,
);

// GET /api/hackit/payment/codes/:universityNumber
router.get(
  "/codes/:universityNumber",
  verifyToken,
  ctrlPaymentController.getStudentPaymentCodes,
);

export default router;
