import { Router } from "express";
import {
  requireAdmin,
  requireTeacherOwner,
} from "../../../../core/middlewares/requireRole.middleware";
import { teacherController } from "../controllers/teacher.controller"; // عدّل
import verifyToken from "../../../../core/middlewares/verifyToken";

const router = Router();

// Post /api/hackit/ctrl/teacher/sendemailpassword
router.post("/sendemailpassword", teacherController.sendResetPasswordOtp);

// Post /api/hackit/ctrl/teacher/forgetPass/:id
router.post("/forgetPass/:id", teacherController.verifyResetOtp);

// Put /api/hackit/ctrl/teacher/changepass
router.put("/changepass/:id", teacherController.changePassword);

// Get /api/hackit/ctrl/teacher/all
router.get("/all", verifyToken, requireAdmin, teacherController.getTeachers);

// Put /api/hackit/ctrl/teacher/update-important/:id
router.put(
  "/update-important/:id",
  verifyToken,
  requireAdmin,
  teacherController.updateImportantTeacherAdmin
);

// Put /api/hackit/ctrl/teacher/update-suspended/:id
router.put(
  "/update-suspended/:id",
  verifyToken,
  requireAdmin,
  teacherController.updateSuspendedTeacherAdmin
);

// Get /api/hackit/ctrl/teacher/admin/profile/:id
router.get(
  "/admin/profile/:id",
  verifyToken,
  requireAdmin,
  teacherController.getProfileTeacher
);

// Get /api/hackit/ctrl/teacher/profile/:id
router.get(
  "/profile/:id",
  verifyToken,
  requireTeacherOwner("id"),
  teacherController.getProfileTeacher
);

// Put /api/hackit/ctrl/teacher/profile/:id
router.put(
  "/profile/:id",
  verifyToken,
  requireTeacherOwner("id"),
  teacherController.updateProfileTeacher
);

// Delete /api/hackit/ctrl/teacher/account/:id
router.delete(
  "/account/:id",
  verifyToken,
  requireAdmin,
  teacherController.deleteTeacherAccount
);

export default router;
