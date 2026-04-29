import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StudentService } from "../services/student.service";
import { badRequest, forbidden } from "../../../../core/errors/httpErrors";

export class StudentController {
  // GET /api/hackit/ctrl/student
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { universityNumber, phoneNumber } = req.query;

    const uni =
      typeof universityNumber === "string" && universityNumber.trim() !== ""
        ? Number(universityNumber)
        : undefined;

    const phone =
      typeof phoneNumber === "string" && phoneNumber.trim() !== ""
        ? phoneNumber
        : undefined;

    const result = await StudentService.getAllStudents(uni, phone);
    res.status(200).json(result);
  });

  // GET /api/hackit/ctrl/student/accountprofilestudent/:id
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await StudentService.getProfileStudent(req.params.id);
    res.status(200).json(result);
  });

  // student.controller.ts - Add this method
  getEnrolledCourses = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const targetId = req.params.id;

    // السماح للطالب بمشاهدة كورساته المسجلة فقط، أو الأدمن لأي طالب
    const isOwner = user?.id === targetId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw forbidden("غير مصرح لك بمشاهدة الكورسات المسجلة لهذا الطالب");
    }

    const result = await StudentService.getEnrolledCourses(targetId);
    res.status(200).json(result);
  });

  // POST /api/hackit/ctrl/student/sendemailpassword
  sendResetPasswordEmail = asyncHandler(async (req: Request, res: Response) => {
    const result = await StudentService.sendEmailForPassword(req.body);
    res.status(200).json(result); // { message, id }
  });

  // POST /api/hackit/ctrl/student/forgetPass/:id
  verifyResetOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await StudentService.forgetPassword(req.body, req.params.id);
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/student/changepass/:id
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await StudentService.changePassword(req.body, req.params.id);
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/student/updatedetailsprofile/:id
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await StudentService.updateProfileStudent(
      req.body,
      req.params.id
    );
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/student/UpdateProfileSuspendedStudent/:id (Admin only غالبًا)
  updateSuspended = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || user.role !== "admin")
      throw forbidden("غير مصرح لك، هذا الإجراء مسموح للأدمن فقط");

    const result = await StudentService.updateProfileSuspendedStudent(
      req.body,
      req.params.id
    );
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/student/UpdateProfileImpStudentAdmin/:id (Admin only)
  updateImportantByAdmin = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || user.role !== "admin")
      throw forbidden("غير مصرح لك، هذا الإجراء مسموح للأدمن فقط");

    const result = await StudentService.updateProfileImpStudentAdmin(
      req.body,
      req.params.id
    );
    res.status(200).json(result);
  });

  // DELETE /api/hackit/ctrl/student/account/:id (Owner or Admin)
  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const targetId = req.params.id;

    const isOwner = user?.id === targetId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) throw forbidden("غير مصرح لك بحذف الحساب");

    const result = await StudentService.deleteStudentAccount(targetId);
    res.status(200).json(result);
  });

  // GET /api/hackit/ctrl/student/check-existence?phoneNumber=&email=&universityNumber=
  checkExistence = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, email, universityNumber } = req.query;

    const result = await StudentService.checkStudentExistence({
      phoneNumber: typeof phoneNumber === "string" ? phoneNumber : undefined,
      email: typeof email === "string" ? email : undefined,
      universityNumber:
        typeof universityNumber === "string" && universityNumber.trim() !== ""
          ? Number(universityNumber)
          : undefined,
    });

    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/student/update-fcm-token/:id
  updateFcmToken = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const targetId = req.params.id;

    if (!user || user.id !== targetId)
      throw forbidden("غير مصرح لك بتحديث FCM Token");

    const result = await StudentService.updateFcmToken(req.body, targetId);
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/student/update-device-id-reset/:id (Admin only)
  updateDeviceIdReset = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || user.role !== "admin")
      throw forbidden("غير مصرح لك، هذا الإجراء مسموح للأدمن فقط");

    const result = await StudentService.updateDeviceIdReset(
      req.body,
      req.params.id
    );
    res.status(200).json(result);
  });

  // Patch /api/hackit/ctrl/student/favorite/course/:courseId/toggle/:id
  toggleFavoriteCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await StudentService.toggleFavoriteCourse(
      req.params.id,
      req.params.courseId
    );
    res.status(200).json(result);
  });

  // Patch /api/hackit/ctrl/student/favorite/session/:sessionId/toggle/:id
  toggleFavoriteSession = asyncHandler(async (req: Request, res: Response) => {
    const result = await StudentService.toggleFavoriteSession(
      req.params.id,
      req.params.sessionId
    );
    res.status(200).json(result);
  });

  // Patch /api/hackit/ctrl/student/course/:courseId/session/:sessionId/user/:id
  addCourseAndSessionForStudent = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await StudentService.addCourseAndSessionForStudent(
        req.params.id,
        req.params.courseId,
        req.params.sessionId
      );
      res.status(200).json(result);
    }
  );

  // Patch /api/hackit/ctrl/student/course/:courseId/exam/:examId/user/:id
  addCourseAndExamForStudent = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await StudentService.addCourseAndExamForStudent(
        req.params.id,
        req.params.courseId,
        req.params.examId
      );
      res.status(200).json(result);
    }
  );

  // POST /api/hackit/ctrl/student/refresh-token
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // الـ Service سيتولى التحقق من صحة البيانات
    const result = await StudentService.refreshStudentToken(req.body);
    
    // إرجاع التوكن الجديد
    res.status(200).json({
      token: result.token,
      message: result.message
    });
  });
}

export const studentController = new StudentController();
