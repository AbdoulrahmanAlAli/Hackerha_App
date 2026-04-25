import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { SingleQuestionService } from "../services/question.service";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";


class QuestionController {
  // ~ POST => /api/.../question
  createQuestion = asyncHandler(async (req: Request, res: Response) => {
    const result = await SingleQuestionService.createSingleQuestion(
      req.body,
      req.file as ICloudinaryFile
    );
    res.status(201).json(result);
  });

  // ~ GET => /api/.../question/:id
  getQuestionById = asyncHandler(async (req: Request, res: Response) => {
    const question = await SingleQuestionService.getSingleQuestionById(req.params.id);
    res.status(200).json(question);
  });

  // ~ GET => /api/.../question/exam/:examId
  getQuestionsByExamId = asyncHandler(async (req: Request, res: Response) => {
    const questions = await SingleQuestionService.getSingleQuestionsByExamId(
      req.params.examId
    );
    res.status(200).json(questions);
  });

  // ✅ NEW: ~ PATCH => /api/.../question/:id/answers
  updateAnswers = asyncHandler(async (req: Request, res: Response) => {
    const result = await SingleQuestionService.updateAnswers(req.params.id, req.body);
    res.status(200).json(result);
  });

  // ~ PUT => /api/.../question/:id/image
  updateQuestion = asyncHandler(async (req: Request, res: Response) => {
    const result = await SingleQuestionService.updateSingleQuestion(
      req.params.id, 
      req.body,
      req.file as ICloudinaryFile  // إضافة هذا الباراميتر
    );
    res.status(200).json(result);
  });

  // ~ DELETE => /api/.../question/:id
  deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
    const result = await SingleQuestionService.deleteSingleQuestion(req.params.id);
    res.status(200).json(result);
  });

  // ~ DELETE => /api/.../question/exam/:examId
  deleteQuestionsByexamId = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await SingleQuestionService.deleteSingleQuestionsByexamId(
        req.params.examId
      );
      res.status(200).json(result);
    }
  );

  // ~ DELETE => /api/.../question/:id/image
  deleteQuestionImage = asyncHandler(async (req: Request, res: Response) => {
    const result = await SingleQuestionService.deleteSingleQuestionImage(req.params.id);
    res.status(200).json(result);
  });

  // controllers/question.controller.ts
  deleteMultipleQuestions = asyncHandler(async (req: Request, res: Response) => {
    console.log("Request body:", req.body); // للتأكد من وصول البيانات
    console.log("IDs:", req.body.ids);
    
    const { ids } = req.body;
    const result = await SingleQuestionService.deleteMultipleQuestions(ids);
    res.status(200).json(result);
  });

  // إعادة ترتيب الأسئلة حسب ترتيب الـ IDs في المصفوفة
  reorderQuestions = asyncHandler(async (req: Request, res: Response) => {
    const { examId } = req.params;
    const { questionIds } = req.body;
    
    // استدعاء خدمة إعادة الترتيب
    const result = await SingleQuestionService.reorderQuestionsByArray(examId, questionIds);
    
    // إرجاع النتيجة
    res.status(200).json({
      success: true,
      data: result
    });
  });
}

export const questionController = new QuestionController();
