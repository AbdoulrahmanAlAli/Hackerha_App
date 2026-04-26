import { Router } from "express";
import verifyToken from "../../../../core/middlewares/verifyToken";
import { upload } from "../../../../core/middlewares/upload.middleware";
import { questionController } from "../controllers/question.controller";
import { requireAdmin } from "../../../../core/middlewares/requireRole.middleware";
import { normalizeFormData } from "../../../../core/middlewares/normalizeFormData";

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

// Get questions by bankId (Auth)
router
  .route("/bank/:bankId")
  .get(verifyToken, questionController.getQuestionsByBankId);

// Delete questions by bankId (Admin)
router  
  .route("/bank/:bankId")
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
    normalizeFormData,
    questionController.createQuestion
  );

// Get question by id (Auth)
router.route("/:id").get(verifyToken, questionController.getQuestionById);

// Update question (Admin)
router
  .route("/:id")
  .put(verifyToken, requireAdmin, upload, normalizeFormData, questionController.updateQuestion);

// Delete question (Admin)
router
  .route("/:id")
  .delete(verifyToken, requireAdmin, questionController.deleteQuestion);

export default router;