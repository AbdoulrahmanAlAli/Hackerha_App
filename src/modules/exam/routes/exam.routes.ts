import { Router } from "express";
import { examController } from "../controllers/exam.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";

const router = Router();

// Create (Admin)
router.post("/", verifyToken, requireAdmin, examController.createExam);

// Read
router.get("/:id", verifyToken, examController.getExamById);
router.get("/course/:courseId", verifyToken, examController.getExamsByCourseId);

// Update (Admin)
router.put("/:id", verifyToken, requireAdmin, examController.updateExam);

// Delete (Admin)
router.delete("/:id", verifyToken, requireAdmin, examController.deleteExam);

export default router;
