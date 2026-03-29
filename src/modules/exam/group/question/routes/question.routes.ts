import { Router } from "express";
import verifyToken from "../../../../../core/middlewares/verifyToken";
import { upload } from "../../../../../core/middlewares/upload.middleware";
import { questionController } from "../controllers/question.controller";
import { requireAdmin } from "../../../../../core/middlewares/requireRole.middleware";


const router: Router = Router();

// Create question (Admin)
router
  .route("/")
  .post(
    verifyToken,
    requireAdmin,
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
  .put(verifyToken, requireAdmin, questionController.updateQuestion);

// ✅ NEW: Update answers only (Admin)
router
  .route("/:id/answers")
  .patch(verifyToken, requireAdmin, questionController.updateAnswers);

// Update image (Admin)
router
  .route("/:id/image")
  .put(
    verifyToken,
    requireAdmin,
    upload,
    questionController.updateQuestionImage
  );

// Delete question (Admin)
router
  .route("/:id")
  .delete(verifyToken, requireAdmin, questionController.deleteQuestion);

// Delete questions by group (Admin)
router
  .route("/group/:groupId")
  .delete(
    verifyToken,
    requireAdmin,
    questionController.deleteQuestionsByGroupId
  );

// Delete question image (Admin)
router
  .route("/:id/image")
  .delete(
    verifyToken,
    requireAdmin,
    questionController.deleteQuestionImage
  );

export default router;
