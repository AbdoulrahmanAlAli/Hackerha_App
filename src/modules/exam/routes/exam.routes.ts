import { Router } from "express";
import { examController } from "../controllers/exam.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";

const router = Router();

// Create (Admin)
router.post("/", verifyToken, checkRole(["admin"]), examController.createExam);

// Read
router.get("/:id", verifyToken, examController.getExamById);
router.get("/course/:courseId", verifyToken, examController.getExamsByCourseId);

// Update (Admin)
router.put("/:id", verifyToken, checkRole(["admin"]), examController.updateExam);

// Delete (Admin)
router.delete("/:id", verifyToken, checkRole(["admin"]), examController.deleteExam);

export default router;
