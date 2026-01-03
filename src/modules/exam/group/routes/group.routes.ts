import { Router } from "express";
import { groupController } from "../controllers/group.controller"; // عدّل المسار حسب مشروعك
import verifyToken from "../../../../core/middlewares/verifyToken";
import checkRole from "../../../../core/middlewares/checkRole";

const router = Router();

// Groups by Exam
router
  .route("/exam/:examId")
  .get(verifyToken, groupController.getGroupsByExamId)
  .delete(verifyToken, checkRole(["admin"]), groupController.deleteGroupsByExamId);

// Create
router
  .route("/")
  .post(verifyToken, checkRole(["admin"]), groupController.createGroup);

// By Id
router
  .route("/:id")
  .get(verifyToken, groupController.getGroupById)
  .put(verifyToken, checkRole(["admin"]), groupController.updateGroup)
  .delete(verifyToken, checkRole(["admin"]), groupController.deleteGroup);

export default router;
