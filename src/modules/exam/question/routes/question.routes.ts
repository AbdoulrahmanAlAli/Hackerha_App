import { Router } from "express";
import verifyToken from "../../../../core/middlewares/verifyToken";
import checkRole from "../../../../core/middlewares/checkRole";
import { upload } from "../../../../core/middlewares/upload.middleware";
import { questionController } from "../controllers/question.controller";


const router: Router = Router();

// Create question (Admin)
router
  .route("/")
  .post(
    verifyToken,
    checkRole(["admin"]),
    upload,
    questionController.createQuestion
  );

// Get question by id (Auth)
router.route("/:id").get(verifyToken, questionController.getQuestionById);

// Get questions by groupId (Auth)
router
  .route("/group/:groupId")
  .get(verifyToken, questionController.getQuestionsByGroupId);

// Update question (Admin)
router
  .route("/:id")
  .put(verifyToken, checkRole(["admin"]), questionController.updateQuestion);

// ✅ NEW: Update answers only (Admin)
router
  .route("/:id/answers")
  .patch(verifyToken, checkRole(["admin"]), questionController.updateAnswers);

// Update image (Admin)
router
  .route("/:id/image")
  .put(
    verifyToken,
    checkRole(["admin"]),
    upload,
    questionController.updateQuestionImage
  );

// Delete question (Admin)
router
  .route("/:id")
  .delete(verifyToken, checkRole(["admin"]), questionController.deleteQuestion);

// Delete questions by group (Admin)
router
  .route("/group/:groupId")
  .delete(
    verifyToken,
    checkRole(["admin"]),
    questionController.deleteQuestionsByGroupId
  );

// Delete question image (Admin)
router
  .route("/:id/image")
  .delete(
    verifyToken,
    checkRole(["admin"]),
    questionController.deleteQuestionImage
  );

export default router;
