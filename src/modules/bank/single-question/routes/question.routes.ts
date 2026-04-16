import { Router } from "express";
import verifyToken from "../../../../core/middlewares/verifyToken";
import { upload } from "../../../../core/middlewares/upload.middleware";
import { questionController } from "../controllers/question.controller";
import { requireAdmin } from "../../../../core/middlewares/requireRole.middleware";

const router: Router = Router();

// ===== SPECIFIC ROUTES (must come first) =====

// Delete multiple questions (Admin)
router
  .route("/multi-delete")
  .delete(
    verifyToken,
    requireAdmin,
    questionController.deleteMultipleQuestions
  );

// Get questions by examId (Auth)
router
  .route("/exam/:bankId")
  .get(verifyToken, questionController.getQuestionsByBankId);

// Delete questions by examId (Admin)
router  
  .route("/exam/:bankId")
  .delete(
    verifyToken,
    requireAdmin,
    questionController.deleteQuestionsBybankId
  );

// Reorder questions (Admin)
router
  .route("/reorder/:bankId")
  .put(
    verifyToken,
    requireAdmin,
    questionController.reorderQuestions
  );

// Update answers only (Admin)
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

// Delete question image (Admin)
router
  .route("/:id/image")
  .delete(
    verifyToken,
    requireAdmin,
    questionController.deleteQuestionImage
  );

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

// Update question (Admin)
router
  .route("/:id")
  .put(verifyToken, requireAdmin, questionController.updateQuestion);

// Delete question (Admin)
router
  .route("/:id")
  .delete(verifyToken, requireAdmin, questionController.deleteQuestion);

export default router;