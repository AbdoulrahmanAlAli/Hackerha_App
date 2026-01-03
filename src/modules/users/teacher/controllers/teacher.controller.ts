import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlTeacherService } from "../services/teacher.service";
import { forbidden, badRequest } from "../../../../core/errors/httpErrors";
import { AuthenticatedRequest } from "../../../../core/http/authenticatedRequest";

class TeacherController {
  // GET /api/hackit/ctrl/teacher/accountprofileteacher/:id
  getProfileTeacher = asyncHandler(async (req: Request, res: Response) => {
    const teacher = await CtrlTeacherService.getProfileTeacher(req.params.id);
    res.status(200).json(teacher);
  });

  // GET /api/hackit/ctrl/teachers (Admin only)
  getTeachers = asyncHandler(async (req: Request, res: Response) => {
    const teachers = await CtrlTeacherService.getTeachers();
    res.status(200).json(teachers);
  });

  // PUT /api/hackit/ctrl/teacher/updatedetailsprofile/:id (Owner only)
  updateProfileTeacher = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlTeacherService.updateProfileTeacher(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/teacher/updateprofileimpteacheradmin/:id (Admin only)
  updateImportantTeacherAdmin = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await CtrlTeacherService.updateImportantTeacherAdmin(
        req.params.id,
        req.body
      );

      res.status(200).json(result);
    }
  );

  // PUT /api/hackit/ctrl/teacher/updateprofilesuspendedteacher/:id (Admin only)
  updateSuspendedTeacherAdmin = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await CtrlTeacherService.updateSuspendedTeacherAdmin(
        req.params.id,
        req.body
      );

      res.status(200).json(result);
    }
  );

  // ===== Forgot password flow =====

  // POST /api/hackit/ctrl/teacher/sendemailpassword (Public)
  sendResetPasswordOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlTeacherService.sendResetPasswordOtp(req.body);
    res.status(200).json(result);
  });

  // POST /api/hackit/ctrl/teacher/forgetPass/:id (Public)  -> verifyResetOtp
  verifyResetOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlTeacherService.verifyResetOtp(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/teacher/changepass/:id (Public)
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlTeacherService.changePassword(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  });

  // DELETE /api/hackit/ctrl/teacher/account/:id (Owner only by default)
  deleteTeacherAccount = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlTeacherService.deleteTeacherAccount(req.params.id);
    res.status(200).json(result);
  });
}

export const teacherController = new TeacherController();
