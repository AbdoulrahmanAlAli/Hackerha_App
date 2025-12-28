import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlStudentService } from "../../../services/users/students/Student.service";
import { AuthenticatedRequest, ICloudinaryFile } from "../../../utils/types";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../middlewares/handleErrors";

class CtrlStudentController {
  // ~ Get => /api/hackit/ctrl/student ~ Get All Student
  getAllStudents = asyncHandler(async (req: Request, res: Response) => {
    const { universityNumber, phoneNumber } = req.query;

    let universityNumberFilter: number | undefined;
    let phoneNumberFilter: string | undefined;

    if (universityNumber) {
      universityNumberFilter = parseInt(universityNumber as string);
    }

    if (phoneNumber) {
      phoneNumberFilter = phoneNumber as string;
    }

    const result = await CtrlStudentService.getAllStudents(
      universityNumberFilter,
      phoneNumberFilter
    );
    res.status(200).json(result);
  });

  // ~ Get => /api/hackit/ctrl/student/accountprofilestudent/:id ~ Get Profile Student
  getProfileStudent = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      if (user?.id !== targetUserId) {
        throw new ForbiddenError("غير مصرح لك ");
      }

      const result = await CtrlStudentService.getProfileStudent(targetUserId);

      res.status(200).json(result);
    }
  );

  // ~ Get => /api/hackit/ctrl/student/favorites/:id ~ Get Favorites Student
  getFavoriteStudent = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      if (user?.id !== targetUserId) {
        throw new ForbiddenError("غير مصرح لك ");
      }

      const result = await CtrlStudentService.getFavoriteStudent(targetUserId);

      res.status(200).json(result);
    }
  );

  // ~ Get => /api/hackit/ctrl/student/banks/:id ~ Get Banks and aggregated contents for student
  getBanksAndContents = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      if (user?.id !== targetUserId) {
        throw new ForbiddenError("غير مصرح لك ");
      }

      const result = await CtrlStudentService.getBanksAndContents(targetUserId);
      res.status(200).json(result);
    }
  );

  // ~ Get => /api/hackit/ctrl/student/enrolledcourses/:id ~ Get enrolled courses for student
  getEnrolledCourses = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      if (user?.id !== targetUserId) {
        throw new ForbiddenError("غير مصرح لك ");
      }

      const result = await CtrlStudentService.getEnrolledCourses(targetUserId);
      res.status(200).json({ enrolledCourses: result });
    }
  );

  // ~ Post => /api/hackit/ctrl/student/sendemailpassword ~ Send Email For Password For Student
  sendEmailForPasswordStudent = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await CtrlStudentService.SendEmailForPasswordStudent(
        req.body
      );
      res.status(200).json({ message: result.message, id: result.id });
    }
  );

  // ~ Post => /api/hackit/ctrl/student/forgetPass/:id ~ Forget Password For Student
  forgetPasswordStudent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const result = await CtrlStudentService.ForgetPasswordStudent(
        req.body,
        req.params.id
      );
      res.status(200).json({ message: result.message });
    }
  );

  // ~ Post => /api/hackit/ctrl/student/changepass/:id ~ Change Password For Student
  ChagePasswordStudent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const result = await CtrlStudentService.ChagePasswordStudent(
        req.body,
        req.params.id
      );
      res.status(200).json({ message: result.message });
    }
  );

  // ~ Put => /api/hackit/ctrl/student/updatedetailsprofile/:id ~ Change details of student
  UpdateProfileStudent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      if (user?.id !== targetUserId) {
        throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
      }

      const result = await CtrlStudentService.UpdateProfileStudent(
        req.body,
        targetUserId
      );

      res.status(200).json({ message: result.message });
    }
  );

  // ~ Put => /api/hackit/ctrl/student/UpdateProfileSuspendedStudent/:id ~ Change Suspended of student
  UpdateProfileSuspendedStudent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const targetUserId = req.params.id;

      const result = await CtrlStudentService.UpdateProfileSuspendedStudent(
        req.body,
        targetUserId
      );

      res.status(200).json({ message: result.message });
    }
  );

  // ~ Put => /api/hackit/ctrl/student/UpdateProfileImpStudentAdmin/:id ~ Change important details of student
  UpdateProfileImpStudentAdmin = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const targetUserId = req.params.id;

      const result = await CtrlStudentService.UpdateProfileImpStudentAdmin(
        req.body,
        targetUserId
      );

      res.status(200).json({ message: result.message });
    }
  );

  // ~ Put => /api/hackit/ctrl/student/updateimageprofile/:id ~ Change Image of student
  UpdateImageProfileStudent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      if (user?.id !== targetUserId) {
        throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
      }

      const result = await CtrlStudentService.UpdateImageProfileStudent(
        req.file as ICloudinaryFile,
        targetUserId
      );

      res.status(200).json({ message: result.message });
    }
  );

  // ~ Delete => /api/hackit/ctrl/student/account/:id ~ Delete Student Account
  DeleteStudentAccount = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      // تحقق إذا كان المستخدم هو صاحب الحساب
      const isOwner = user?.id === targetUserId;

      // تحقق إذا كان المستخدم هو أدمن
      const isAdmin = user?.role === "admin";

      // السماح إذا كان صاحب الحساب أو أدمن
      if (!isOwner && !isAdmin) {
        throw new ForbiddenError("غير مصرح لك بحذف الحساب");
      }

      const result = await CtrlStudentService.DeleteStudentAccount(
        targetUserId
      );

      res.status(200).json({ message: result.message });
    }
  );

  // ~ patch /api/hackit/ctrl/student/favorite/course/:courseId/toggle/:id
  toggleFavoriteCourse = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const targetUserId = req.params.id;

    if (user?.id !== targetUserId) {
      throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
    }

    const result = await CtrlStudentService.toggleFavoriteCourse(
      targetUserId,
      req.params.courseId
    );
    res.status(200).json(result);
  });

  // ~ patch /api/hackit/ctrl/student/favorite/session/:sessionId/toggle/:id
  toggleFavoriteSession = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const targetUserId = req.params.id;

    if (user?.id !== targetUserId) {
      throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
    }

    const result = await CtrlStudentService.toggleFavoriteSession(
      targetUserId,
      req.params.sessionId
    );
    res.status(200).json(result);
  });

  // ~ patch /api/hackit/ctrl/student/favorite/bank/:bankId/toggle/:id
  toggleFavoriteBank = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const targetUserId = req.params.id;

    if (user?.id !== targetUserId) {
      throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
    }

    const result = await CtrlStudentService.toggleFavoriteBank(
      targetUserId,
      req.params.bankId
    );
    res.status(200).json(result);
  });

  // ~ Get => /api/univers/ctrl/student/check-existence ~ Check if phone, email, or university number exists
  checkStudentExistence = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { phoneNumber, email, universityNumber } = req.query;

      const result = await CtrlStudentService.checkStudentExistence({
        phoneNumber: phoneNumber as string,
        email: email as string,
        universityNumber: universityNumber
          ? Number(universityNumber)
          : undefined,
      });

      res.status(200).json(result);
    }
  );

  // Check favorite item using query parameters
  checkFavoriteItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { courseId, sessionId, bankId } = req.query;

    const isFavorite = await CtrlStudentService.checkFavoriteItem(
      id,
      courseId as string,
      sessionId as string,
      bankId as string
    );

    res.status(200).json({ isFavorite });
  });

  // ~ Patch => /api/hackit/ctrl/student/bank/:bankId/content/:contentId/user/:id
  addBankAndContentForStudent = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const { id, bankId, contentId } = req.params;

      if (user?.id !== id) {
        throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
      }

      const result = await CtrlStudentService.addBankAndContentForStudent(
        id,
        bankId,
        contentId
      );
      res.status(200).json(result);
    }
  );

  // ~ Patch => /api/hackit/ctrl/student/course/:courseId/session/:sessionId/user/:id
  addCourseAndSessionForStudent = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const { id, courseId, sessionId } = req.params;

      if (user?.id !== id) {
        throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
      }

      const result = await CtrlStudentService.addCourseAndSessionForStudent(
        id,
        courseId,
        sessionId
      );
      res.status(200).json(result);
    }
  );

  // ~ Patch => /api/hackit/ctrl/student/course/:courseId/exam/:examId/user/:id
  addCourseAndExamForStudent = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const { id, courseId, examId } = req.params;

      if (user?.id !== id) {
        throw new ForbiddenError("غير مصرح لك بتعديل هذا الملف الشخصي");
      }

      const result = await CtrlStudentService.addCourseAndExamForStudent(
        id,
        courseId,
        examId
      );
      res.status(200).json(result);
    }
  );

  // ~ Put => /api/hackit/ctrl/student/update-fcm-token/:id ~ Update FCM Token
  updateFcmToken = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      if (user?.id !== targetUserId) {
        throw new ForbiddenError("غير مصرح لك بتحديث FCM Token");
      }

      const result = await CtrlStudentService.updateFcmToken(
        req.body,
        targetUserId
      );

      res.status(200).json(result);
    }
  );

  // ~ Put => /api/hackit/ctrl/student/update-device-id-reset/:id ~ Update device_id_reset (Admin Only)
  updateDeviceIdReset = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const targetUserId = req.params.id;

      // التحقق من أن المستخدم هو أدمن فقط
      if (user?.role !== "admin") {
        throw new ForbiddenError("غير مصرح لك، هذا الإجراء مسموح للأدمن فقط");
      }

      const result = await CtrlStudentService.updateDeviceIdReset(
        req.body,
        targetUserId
      );

      res.status(200).json(result);
    }
  );
}

export const ctrlStudentController = new CtrlStudentController();
