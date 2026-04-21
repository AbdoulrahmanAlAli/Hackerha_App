import { Router } from "express";
import { requireAdmin } from "../../../../core/middlewares/requireRole.middleware";
import { authTeacherController } from "../controllers/teacher.auth.controller"; // عدّل
import verifyToken from "../../../../core/middlewares/verifyToken";
import { upload } from "../../../../core/middlewares/upload.middleware";
import { normalizeTeacherFormData } from "../../../../core/middlewares/normalizeFormData";

const router = Router();

// Post /api/hackit/ctrl/teacher/register ~ Create New Teacher
router.post(
  "/register",
  verifyToken,
  requireAdmin,
  upload,
  normalizeTeacherFormData,
  authTeacherController.createNewTeacher
);

// Post /api/hackit/ctrl/teacher/login ~ Login Teacher
router.post("/login", authTeacherController.loginTeacher);

export default router;
