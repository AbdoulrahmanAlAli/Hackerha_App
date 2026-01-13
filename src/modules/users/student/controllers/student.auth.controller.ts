import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AuthStudentService } from "../services/student.auth.service";

export class StudentAuthController {
  // POST /api/hackit/ctrl/student/register
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthStudentService.createNewStudent(req.body);
    res.status(201).json(result);
  });

  // POST /api/hackit/ctrl/student/verifyotp/:idhttps://www.youtube.com/
  
  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthStudentService.verifyOtp(req.body, req.params.id);
    res.status(200).json(result); // { message, token }
  });

  // POST /api/hackit/ctrl/student/reSendOtp/:id
  resendOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthStudentService.reSendOtp(req.body, req.params.id);
    res.status(200).json(result);
  });

  // POST /api/hackit/ctrl/student/login
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthStudentService.loginStudent(req.body);
    res.status(200).json(result);
  });
}

export const studentAuthController = new StudentAuthController();
