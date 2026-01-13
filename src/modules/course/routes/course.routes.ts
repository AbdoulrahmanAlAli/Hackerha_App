import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";
import { upload } from "../../../core/middlewares/upload.middleware";
import { ctrlCourseController } from "../controllers/course.controller";
import { normalizeCourseFormData } from "../../../core/middlewares/normalizeFormData";

const router: Router = Router();

// Post /api/hackit/ctrl/course
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  upload,
  normalizeCourseFormData,
  ctrlCourseController.createCourse
);

// Get /api/hackit/ctrl/course
router.get("/", verifyToken, ctrlCourseController.getAllCourses);

// Put /api/hackit/ctrl/course/imagecourse/:id
router.put(
  "/imagecourse/:id",
  verifyToken,
  checkRole(["admin"]),
  upload,
  ctrlCourseController.updateCourseImage
);

// Patch /api/hackit/ctrl/course/removeStudent/course/:courseId
router.patch(
  "/removeStudent/course/:courseId",
  verifyToken,
  checkRole(["admin"]),
  ctrlCourseController.removeStudentFromCourse
);

// Get /api/hackit/ctrl/course/:id
router.get("/:id", verifyToken, ctrlCourseController.getCourseById);

// Put /api/hackit/ctrl/course/:id
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlCourseController.updateCourse
);

// Delete /api/hackit/ctrl/course/:id
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlCourseController.deleteCourse
);

export default router;
