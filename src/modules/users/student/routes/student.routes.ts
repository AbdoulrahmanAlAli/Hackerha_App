import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import verifyToken from "../../../../core/middlewares/verifyToken";
import checkRole from "../../../../core/middlewares/checkRole";
import {
  requireAdmin,
  requireStudentOwner,
} from "../../../../core/middlewares/requireRole.middleware";

const router = Router();

// GET /api/hackit/ctrl/student  (Admin)
router.get("/", verifyToken, checkRole(["admin"]), studentController.getAll);

// GET /api/hackit/ctrl/student/accountprofilestudent/:id (Student)
router.get(
  "/accountprofilestudent/:id",
  verifyToken,
  requireStudentOwner("id"),
  studentController.getProfile
);

// POST /api/hackit/ctrl/student/sendemailpassword (Public)
router.post("/sendemailpassword", studentController.sendResetPasswordEmail);

// POST /api/hackit/ctrl/student/forgetPass/:id (Public)
router.post("/forgetPass/:id", studentController.verifyResetOtp);

// PUT /api/hackit/ctrl/student/changepass/:id (Public)
router.put("/changepass/:id", studentController.changePassword);

// PUT /api/hackit/ctrl/student/updatedetailsprofile/:id (Student)
router.put(
  "/updatedetailsprofile/:id",
  verifyToken,
  requireStudentOwner("id"),
  studentController.updateProfile
);

// PUT /api/hackit/ctrl/student/updateprofileimpstudentadmin/:id (Admin)
router.put(
  "/updateprofileimpstudentadmin/:id",
  verifyToken,
  requireAdmin,
  studentController.updateImportantByAdmin
);

// PUT /api/hackit/ctrl/student/UpdateProfileSuspendedStudent/:id (Admin)
router.put(
  "/UpdateProfileSuspendedStudent/:id",
  verifyToken,
  requireAdmin,
  studentController.updateSuspended
);

// DELETE /api/hackit/ctrl/student/account/:id (Student or Admin)
router.delete(
  "/account/:id",
  verifyToken,
  checkRole(["student", "admin"]),
  studentController.deleteAccount
);

// GET /api/hackit/ctrl/student/check-existence (Public)
router.get("/check-existence", studentController.checkExistence);

// PUT /api/hackit/ctrl/student/update-fcm-token/:id (Student)
router.put(
  "/update-fcm-token/:id",
  verifyToken,
  requireStudentOwner("id"),
  studentController.updateFcmToken
);

// PUT /api/hackit/ctrl/student/update-device-id-reset/:id (Admin)
router.put(
  "/update-device-id-reset/:id",
  verifyToken,
  requireAdmin,
  studentController.updateDeviceIdReset
);

/**
 * ====== endpoints التالية تحتاج Modules غير منقولة بعد ======
 * لما ننقل services الخاصة فيها، نفعلها فورًا.
 */

// router.get("/favorites/:id", verifyToken, checkRole(["student"]), ...);
// router.patch("/favorite/course/:courseId/toggle/:id", verifyToken, checkRole(["student"]), ...);
// router.patch("/favorite/session/:sessionId/toggle/:id", verifyToken, checkRole(["student"]), ...);
// router.patch("/favorite/bank/:bankId/toggle/:id", verifyToken, checkRole(["student"]), ...);
// router.get("/favorites/check/:id", verifyToken, checkRole(["student"]), ...);

// router.get("/workcontinue/:id", verifyToken, checkRole(["student"]), ...);
// router.get("/enrolledcourses/:id", verifyToken, checkRole(["student"]), ...);
// router.get("/student-content/:id", verifyToken, checkRole(["student"]), ...);

// router.patch("/bank/:bankId/content/:contentId/user/:id", verifyToken, checkRole(["student"]), ...);
// router.patch("/course/:courseId/session/:sessionId/user/:id", verifyToken, checkRole(["student"]), ...);
// router.patch("/course/:courseId/exam/:examId/user/:id", verifyToken, checkRole(["student"]), ...);

// router.put("/updateimageprofile/:id", verifyToken, checkRole(["student"]), upload, ...);

export default router;
