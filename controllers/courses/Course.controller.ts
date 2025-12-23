import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlCourseService } from "../../services/courses/Course.service";
import { AuthenticatedRequest } from "../../utils/types";
import { ICloudinaryFile } from "../../utils/types";
import { BadRequestError } from "../../middlewares/handleErrors";

class CtrlCourseController {
  // ~ POST /api/hackit/ctrl/course - Create course
  createCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlCourseService.createCourse(
      req.body,
      req.file as ICloudinaryFile
    );
    res.status(201).json(result);
  });

  // ~ GET /api/hackit/ctrl/course/:id - Get course by ID
  getCourseById = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      throw new BadRequestError("token not found");
    }

    const course = await CtrlCourseService.getCourseById(
      req.params.id,
      user?.id,
      user?.role
    );
    res.status(200).json(course);
  });

  // ~ GET /api/hackit/ctrl/course - Get all courses
  getAllCourses = asyncHandler(async (req: Request, res: Response) => {
    const { name, type, hasDiscount, year, semester, createdLessThanDays } =
      req.query;

    // Validate type if provided
    if (type && !["نظري", "عملي", "شاملة"].includes(type as string)) {
      throw new BadRequestError("يجب ان يكون نظري او عملي أو شامل");
    }

    // Validate year if provided (يبقى كرقم للتحقق)
    let yearString: string | undefined;
    if (year) {
      const yearNum = parseInt(year as string);
      if (isNaN(yearNum)) {
        throw new BadRequestError("السنة الدراسية يجب أن تكون رقماً");
      }
      if (yearNum < 1 || yearNum > 5) {
        throw new BadRequestError("السنة الدراسية يجب أن تكون بين 1 و 5");
      }
      yearString = year.toString(); // تحويل إلى string
    }

    // Validate semester if provided (يبقى كرقم للتحقق)
    let semesterString: string | undefined;
    if (semester) {
      const semesterNum = parseInt(semester as string);
      if (isNaN(semesterNum)) {
        throw new BadRequestError("الفصل الدراسي يجب أن يكون رقماً");
      }
      if (semesterNum < 1 || semesterNum > 2) {
        throw new BadRequestError("الفصل الدراسي يجب أن يكون 1 أو 2");
      }
      semesterString = semester.toString(); // تحويل إلى string
    }

    if (createdLessThanDays) {
      const daysNum = parseInt(createdLessThanDays as string);
      if (isNaN(daysNum)) {
        throw new BadRequestError("عدد الأيام يجب أن يكون رقماً");
      }
      if (daysNum < 1) {
        throw new BadRequestError("عدد الأيام يجب أن يكون أكبر من صفر");
      }
      if (daysNum > 365) {
        throw new BadRequestError("عدد الأيام يجب أن يكون أقل من أو يساوي 365");
      }
    }

    // Prepare filters object - إرسال strings بدلاً من numbers
    const filters = {
      name: name as string,
      type: type as "نظري" | "عملي" | "شاملة",
      hasDiscount: hasDiscount ? hasDiscount === "true" : undefined,
      year: yearString, // ← إرسال كـ string
      semester: semesterString, // ← إرسال كـ string
      createdLessThanDays: createdLessThanDays
        ? parseInt(createdLessThanDays as string)
        : undefined,
    };

    // Get filtered courses
    const courses = await CtrlCourseService.getAllCourses(filters);

    res.status(200).json(courses);
  });

  // ~ PUT /api/hackit/ctrl/course/:id - Update course
  updateCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlCourseService.updateCourse(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  });

  // ~ DELETE /api/hackit/ctrl/course/:id - Delete course
  deleteCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlCourseService.deleteCourse(req.params.id);
    res.status(200).json(result);
  });

  // ~ PUT /api/hackit/ctrl/course/imagecourse/:id - Update course image
  updateCourseImage = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await CtrlCourseService.updateCourseImage(
        req.file as ICloudinaryFile,
        req.params.id
      );
      res.status(200).json(result);
    }
  );

  // ~ Patch => /api/hackit/ctrl/course/removeStudent/course/:courseId
  RemoveStudentFromCourse = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { courseId } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        throw new BadRequestError("معرف الطالب مطلوب");
      }

      const result = await CtrlCourseService.RemoveStudentFromCourse(
        courseId,
        studentId
      );
      res.status(200).json(result);
    }
  );
}

export const ctrlCourseController = new CtrlCourseController();
