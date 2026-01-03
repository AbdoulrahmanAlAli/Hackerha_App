import { Router } from "express";
import { studentAuthController } from "../controllers/student.auth.controller";

const router = Router();

// POST /api/hackit/ctrl/student/register
router.post("/register", studentAuthController.register);

// POST /api/hackit/ctrl/student/verifyotp/:id
router.post("/verifyotp/:id", studentAuthController.verifyOtp);

// POST /api/hackit/ctrl/student/reSendOtp/:id
router.post("/reSendOtp/:id", studentAuthController.resendOtp);

// POST /api/hackit/ctrl/student/login
router.post("/login", studentAuthController.login);

export default router;
