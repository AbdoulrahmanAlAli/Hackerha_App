import { Router } from "express";
import { groupController } from "../controllers/group.controller";
import verifyToken from "../../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../../core/middlewares/requireRole.middleware";

const router = Router();

// Groups by Exam
router
  .route("/exam/:examId")
  .get(verifyToken, groupController.getGroupsByExamId)
  .delete(verifyToken, requireAdmin, groupController.deleteGroupsByExamId);

// Create
router
  .route("/")
  .post(verifyToken, requireAdmin, groupController.createGroup);

// By Id
router
  .route("/:id")
  .get(verifyToken, groupController.getGroupById)
  .put(verifyToken, requireAdmin, groupController.updateGroup)
  .delete(verifyToken, requireAdmin, groupController.deleteGroup);

export default router;
