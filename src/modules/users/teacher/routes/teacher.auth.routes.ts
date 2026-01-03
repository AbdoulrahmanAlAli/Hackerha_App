import { Router } from "express";
import { requireAdmin } from "../../../../core/middlewares/requireRole.middleware";
import { authTeacherController } from "../controllers/teacher.auth.controller"; // عدّل
import verifyToken from "../../../../core/middlewares/verifyToken";

const router = Router();

// admin only
router.post(
  "/register",
  verifyToken,
  requireAdmin,
  authTeacherController.createNewTeacher
);

// public
router.post("/login", authTeacherController.loginTeacher);

export default router;
