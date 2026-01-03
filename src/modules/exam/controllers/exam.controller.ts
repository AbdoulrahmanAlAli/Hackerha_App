import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { ExamService } from "../services/exam.service";

class ExamController {
  createExam = asyncHandler(async (req: Request, res: Response) => {
    const result = await ExamService.createExam(req.body);
    res.status(201).json(result);
  });

  getExamById = asyncHandler(async (req: Request, res: Response) => {
    const exam = await ExamService.getExamById(req.params.id);
    res.status(200).json(exam);
  });

  getExamsByCourseId = asyncHandler(async (req: Request, res: Response) => {
    const exams = await ExamService.getExamsByCourseId(req.params.courseId);
    res.status(200).json(exams);
  });

  updateExam = asyncHandler(async (req: Request, res: Response) => {
    const result = await ExamService.updateExam(req.params.id, req.body);
    res.status(200).json(result);
  });

  deleteExam = asyncHandler(async (req: Request, res: Response) => {
    const result = await ExamService.deleteExam(req.params.id);
    res.status(200).json(result);
  });
}

export const examController = new ExamController();
