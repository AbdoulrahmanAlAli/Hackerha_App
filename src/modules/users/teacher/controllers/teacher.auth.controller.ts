import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AuthTeacherService } from "../services/teacher.auth.service";

class AuthTeacherController {
  // POST /api/hackit/ctrl/teacher/register
  createNewTeacher = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthTeacherService.createNewTeacher(req.body);
    res.status(201).json(result);
  });

  // POST /api/hackit/ctrl/teacher/login
  loginTeacher = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthTeacherService.loginTeacher(req.body);
    res.status(200).json(result);
  });
}

export const authTeacherController = new AuthTeacherController();
