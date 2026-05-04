import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { CtrlCourseService } from "../services/course.service";
import { ICloudinaryFile } from "../../../core/types/cloudinary.types";
import { getCoursesQuerySchema } from "../schemas/course.schema";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { AuthenticatedRequest } from "../../../core/http/authenticatedRequest";

class CtrlCourseController {
  // POST /api/hackit/ctrl/course
  createCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlCourseService.createCourse(
      req.body,
      req.file as ICloudinaryFile
    );
    res.status(201).json(result);
  });

  // GET /api/hackit/ctrl/course/:id
  getCourseById = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      throw notFound("لا يوجد مستخدم");
    }
    const course = await CtrlCourseService.getCourseById(
      req.params.id,
      user
    );
    res.status(200).json(course);
  });

  // GET /api/hackit/ctrl/course
  getAllCourses = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      throw notFound("لا يوجد مستخدم");
    }
    
    const courses = await CtrlCourseService.getAllCourses(req.query, user);
    
    res.status(200).json(courses);
  });

  // PUT /api/hackit/ctrl/course/:id
  updateCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlCourseService.updateCourse(
      req.params.id,
      req.body,
      req.file as ICloudinaryFile
    );
    res.status(200).json(result);
  });

  // DELETE /api/hackit/ctrl/course/:id
  deleteCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlCourseService.deleteCourse(req.params.id);
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/course/imagecourse/:id
  updateCourseImage = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlCourseService.updateCourseImage(
      req.file as ICloudinaryFile,
      req.params.id
    );
    res.status(200).json(result);
  });

  // PATCH /api/hackit/ctrl/course/removeStudent/course/:courseId
  removeStudentFromCourse = asyncHandler(
    async (req: Request, res: Response) => {
      const { courseId } = req.params;
      const { studentId } = req.body;

      if (!studentId) throw badRequest("معرف الطالب مطلوب");

      const result = await CtrlCourseService.removeStudentFromCourse(
        courseId,
        studentId
      );
      res.status(200).json(result);
    }
  );
}

export const ctrlCourseController = new CtrlCourseController();
