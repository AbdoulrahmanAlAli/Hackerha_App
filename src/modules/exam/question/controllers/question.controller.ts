import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { QuestionService } from "../services/question.service";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";


class QuestionController {
  // ~ POST => /api/.../question
  createQuestion = asyncHandler(async (req: Request, res: Response) => {
    const result = await QuestionService.createQuestion(
      req.body,
      req.file as ICloudinaryFile
    );
    res.status(201).json(result);
  });

  // ~ GET => /api/.../question/:id
  getQuestionById = asyncHandler(async (req: Request, res: Response) => {
    const question = await QuestionService.getQuestionById(req.params.id);
    res.status(200).json(question);
  });

  // ~ GET => /api/.../question/group/:groupId
  getQuestionsByGroupId = asyncHandler(async (req: Request, res: Response) => {
    const questions = await QuestionService.getQuestionsByGroupId(
      req.params.groupId
    );
    res.status(200).json(questions);
  });

  // ~ PUT => /api/.../question/:id
  updateQuestion = asyncHandler(async (req: Request, res: Response) => {
    const result = await QuestionService.updateQuestion(req.params.id, req.body);
    res.status(200).json(result);
  });

  // ✅ NEW: ~ PATCH => /api/.../question/:id/answers
  updateAnswers = asyncHandler(async (req: Request, res: Response) => {
    const result = await QuestionService.updateAnswers(req.params.id, req.body);
    res.status(200).json(result);
  });

  // ~ PUT => /api/.../question/:id/image
  updateQuestionImage = asyncHandler(async (req: Request, res: Response) => {
    const result = await QuestionService.updateQuestionImage(
      req.params.id,
      req.file as ICloudinaryFile
    );
    res.status(200).json(result);
  });

  // ~ DELETE => /api/.../question/:id
  deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
    const result = await QuestionService.deleteQuestion(req.params.id);
    res.status(200).json(result);
  });

  // ~ DELETE => /api/.../question/group/:groupId
  deleteQuestionsByGroupId = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await QuestionService.deleteQuestionsByGroupId(
        req.params.groupId
      );
      res.status(200).json(result);
    }
  );

  // ~ DELETE => /api/.../question/:id/image
  deleteQuestionImage = asyncHandler(async (req: Request, res: Response) => {
    const result = await QuestionService.deleteQuestionImage(req.params.id);
    res.status(200).json(result);
  });
}

export const questionController = new QuestionController();
