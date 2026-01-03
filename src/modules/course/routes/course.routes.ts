import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";
import { upload } from "../../../core/middlewares/upload.middleware";
import { ctrlCourseController } from "../controllers/course.controller";
import { normalizeCourseFormData } from "../../../core/middlewares/normalizeFormData";

const router: Router = Router();

// ===== Base: /api/hackit/ctrl/course =====

// Create (Admin only)
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  upload,
  normalizeCourseFormData,
  ctrlCourseController.createCourse
);

// Get all (requires token)
router.get("/", verifyToken, ctrlCourseController.getAllCourses);

// Update image (Admin only) — لازم قبل /:id
router.put(
  "/imagecourse/:id",
  verifyToken,
  checkRole(["admin"]),
  upload,
  ctrlCourseController.updateCourseImage
);

// Remove student from course (Admin only) — لازم قبل /:id
router.patch(
  "/removeStudent/course/:courseId",
  verifyToken,
  checkRole(["admin"]),
  ctrlCourseController.removeStudentFromCourse
);

// Get course by id (requires token)
router.get("/:id", verifyToken, ctrlCourseController.getCourseById);

// Update course (Admin only)
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlCourseController.updateCourse
);

// Delete course (Admin only)
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlCourseController.deleteCourse
);

export default router;
