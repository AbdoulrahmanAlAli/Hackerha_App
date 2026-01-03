import { Router } from "express";
import { requireAdmin, requireTeacherOwner } from "../../../../core/middlewares/requireRole.middleware";
import { teacherController } from "../controllers/teacher.controller"; // عدّل
import verifyToken from "../../../../core/middlewares/verifyToken";

const router = Router();

/**
 * Public (forgot password)
 */
router.post("/sendemailpassword", teacherController.sendResetPasswordOtp);
router.post("/forgetPass/:id", teacherController.verifyResetOtp);
router.put("/changepass/:id", teacherController.changePassword);

/**
 * Admin only
 */
router.get("/all", verifyToken, requireAdmin, teacherController.getTeachers);
router.put("/update-important/:id", verifyToken, requireAdmin, teacherController.updateImportantTeacherAdmin);
router.put("/update-suspended/:id", verifyToken, requireAdmin, teacherController.updateSuspendedTeacherAdmin);
router.get("/admin/profile/:id", verifyToken, requireAdmin, teacherController.getProfileTeacher);

/**
 * Teacher owner only
 */
router.get("/profile/:id", verifyToken, requireTeacherOwner("id"), teacherController.getProfileTeacher);
router.put("/profile/:id", verifyToken, requireTeacherOwner("id"), teacherController.updateProfileTeacher);
router.delete("/account/:id", verifyToken, requireAdmin, teacherController.deleteTeacherAccount);

export default router;
