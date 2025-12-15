import { BadRequestError, NotFoundError } from "../../middlewares/handleErrors";
import { ICourse } from "../../models/courses/dtos";
import {
  Course,
  validateCreateCourse,
  validateUpdateCourse,
} from "../../models/courses/Course.model";
import { ICloudinaryFile } from "../../utils/types";
import { Comment } from "../../models/courses/comment/Comment.model";
import { Session } from "../../models/courses/session/Session.model";
import { Teacher } from "../../models/users/teachers/Teacher.model";
import { Exam } from "../../models/courses/exam/Exam.model";
import mongoose from "mongoose";
import { Student } from "../../models/users/students/Student.model";
import { VideoTokenService } from "./session/token/Token.service";

class CtrlCourseService {
  // ~ POST /api/hackit/ctrl/course - Create a new course
  static async createCourse(courseData: ICourse, file: ICloudinaryFile) {
    // Validate course data
    const { error } = validateCreateCourse(courseData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (!file) {
      throw new BadRequestError("صورة الكورس مطلوبة");
    }

    const existingCourse = await Course.findOne({ name: courseData.name });
    if (existingCourse) {
      throw new BadRequestError("الكورس موجود بالفعل");
    }

    if (courseData.free) {
      courseData.price = 0;
    }

    const teacherHave = await Teacher.findById(courseData.teacher);
    if (!teacherHave) {
      throw new NotFoundError("المعلم غير موجود");
    }

    // Create new course
    const course = await Course.create({
      ...courseData,
      discount: {
        dis: courseData.discount.dis,
        rate: courseData.discount.dis ? courseData.discount.rate : 0,
      },
      image: file.path,
    });

    if (!course) throw new NotFoundError("فشل إنشاء الكورس");

    return {
      message: "تم إنشاء الكورس بنجاح",
    };
  }

  // ~ GET /api/hackit/ctrl/course/:id - Get course by ID
  static async getCourseById(id: string, studentId: string, role: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("معرف الكورس غير صالح");
    }

    const course = await Course.findById(id)
      .populate("teacher")
      .populate({
        path: "sessions",
        options: { sort: { createdAt: -1 } },
      })
      .populate({
        path: "exams",
        options: { sort: { createdAt: -1 } },
      })
      .populate({
        path: "comments",
        populate: {
          path: "studentId",
          select: "userName profilePhoto",
        },
        options: { sort: { createdAt: -1 } },
      })
      .populate("students", "userName profilePhoto")
      .lean();

    if (!course) throw new NotFoundError("الكورس غير موجود");

    // Check if student is enrolled in the course
    let isEnrolled = false;

    const sessions = course.sessions || [];
    const exams = course.exams || [];

    const teacherId =
      (course.teacher as any)._id?.toString() ||
      (course.teacher as any).toString();

    const teacherStats = await this.calculateTeacherStats(teacherId);

    const totalDurationInSeconds = sessions.reduce((total, session) => {
      const durationString = (session as any).duration || "0:00";
      return total + this.parseDurationToSeconds(durationString);
    }, 0);

    const totalCourseDuration = this.formatSecondsToDuration(
      totalDurationInSeconds
    );

    // FIRST THING: Get total files count
    const totalFiles = sessions.reduce((total, session) => {
      return (
        total + ((session as any).files ? (session as any).files.length : 0)
      );
    }, 0);

    // SECOND THING: Get session with number = 1 separately (not from populate)
    const firstSession = await Session.findOne({
      courseId: id,
      number: 1,
    }).lean();

    // إصلاح الخطأ والترتيب من الأقدم للأحدث
    const allActivities = [
      ...sessions.map((session) => ({
        ...session,
        type: "session" as const,
      })),
      ...exams.map((exam) => ({
        ...exam,
        type: "exam" as const,
      })),
    ].sort((a, b) => {
      // التحقق من وجود createdAt واستخدامه للترتيب
      const dateA = new Date((a as any).createdAt).getTime();
      const dateB = new Date((b as any).createdAt).getTime();
      return dateA - dateB; // من الأقدم إلى الأحدث
    });

    // إزالة sessions و exams من النتيجة
    const {
      sessions: _,
      exams: __,
      whatsapp: whatsappField,
      ...courseWithoutArrays
    } = course as any;

    const courseWithStats = {
      ...courseWithoutArrays,
      studentsCount: course.students?.length || 0,
      sessionsCount: sessions.length,
      examsCount: exams.length,
      commentsCount: course.comments?.length || 0,
      teacherRating: teacherStats.averageRating,
      discountedPrice:
        course.discount?.dis && course.discount?.rate
          ? course.price * (1 - course.discount.rate / 100)
          : course.price,
      isDiscounted: course.discount?.dis || false,
      sessionsAndExams: allActivities,
      // FIRST THING: Add file count
      totalFiles: totalFiles,
      totalCourseDuration: totalCourseDuration,
      // SECOND THING: Add first session separately
      firstSession: firstSession,
      whatsapp: whatsappField,
    };

    const courseNotEnrolled = {
      ...courseWithoutArrays,
      studentsCount: course.students?.length || 0,
      sessionsCount: sessions.length,
      examsCount: exams.length,
      commentsCount: course.comments?.length || 0,
      teacherRating: teacherStats.averageRating,
      discountedPrice:
        course.discount?.dis && course.discount?.rate
          ? course.price * (1 - course.discount.rate / 100)
          : course.price,
      isDiscounted: course.discount?.dis || false,
      // FIRST THING: Add file count for non-enrolled too
      totalFiles: totalFiles,
      totalCourseDuration: totalCourseDuration,
      // SECOND THING: Add first session for non-enrolled too
      firstSession: firstSession,
    };

    if (role === "student") {
      if (!studentId) {
        throw new BadRequestError("معرف الطالب مطلوب");
      }

      const student = await Student.findById(studentId).select(
        "enrolledCourses"
      );
      if (!student) {
        throw new NotFoundError("الطالب غير موجود");
      }

      // Check if the course ID exists in student's enrolledCourses array
      isEnrolled = student.enrolledCourses.some(
        (enrolledCourseId) => enrolledCourseId.toString() === id
      );

      if (!isEnrolled) {
        return courseNotEnrolled;
      }
    }

    return courseWithStats;
  }

  // ~ GET /api/hackit/ctrl/course - Get all courses
  static async getAllCourses(queryParams: {
    name?: string;
    type?: "نظري" | "عملي";
    hasDiscount?: boolean;
    year?: number;
    semester?: number;
    createdLessThanDays?: number;
  }) {
    const { name, type, hasDiscount, year, semester, createdLessThanDays } =
      queryParams;

    const filter: any = {};

    if (name) filter.name = { $regex: name, $options: "i" };
    if (type) filter.type = type;
    if (hasDiscount !== undefined) filter["discount.dis"] = hasDiscount;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;

    if (createdLessThanDays) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - createdLessThanDays);
      filter.createdAt = { $gte: dateThreshold };
    }

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .select("-__v")
      .populate("teacher");

    return courses;
  }

  // ~ PUT /api/hackit/ctrl/course/:id - Update course
  static async updateCourse(id: string, courseData: Partial<ICourse>) {
    const { error } = validateUpdateCourse(courseData);
    if (error) throw new BadRequestError(error.details[0].message);

    if (courseData.free === true) {
      courseData.price = 0;
    } else if (courseData.free === false && courseData.price === 0) {
      throw new BadRequestError("لا يمكن أن يكون الكورس مدفوعاً وسعره صفر");
    }

    if (courseData.discount?.dis && !courseData.discount.rate) {
      throw new BadRequestError("نسبة التخفيض مطلوبة عندما يكون هناك تخفيض");
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, courseData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!updatedCourse) throw new NotFoundError("فشل تحديث الكورس");

    return {
      message: "تم تحديث الكورس بنجاح",
    };
  }

  // ~ DELETE /api/hackit/ctrl/course/:id - Delete course
  static async deleteCourse(id: string) {
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) throw new NotFoundError("فشل حذف الكورس");
    return { message: "تم حذف الكورس بنجاح" };
  }

  // ~ PUT /api/hackit/ctrl/course/imagecourse/:id - Update course image
  static async updateCourseImage(file: ICloudinaryFile, id: string) {
    if (!file) throw new BadRequestError("صورة الكورس مطلوبة");

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: { image: file.path } },
      { new: true }
    );

    if (!updatedCourse) throw new NotFoundError("فشل تحديث صورة الكورس");

    return { message: "تم تحديث صورة الكورس بنجاح" };
  }

  // Calculate Teacher Stats
  static async calculateTeacherStats(teacherId: string) {
    const teacherCourses = await Course.find({ teacher: teacherId });

    if (teacherCourses.length === 0) {
      return {
        averageRating: 0,
      };
    }

    const totalRating = teacherCourses.reduce(
      (sum, course) => sum + (course.rating || 0),
      0
    );
    const averageRating = totalRating / teacherCourses.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  // دالة مساعدة لتحويل تنسيق المدة (مثال: "5:00" أو "1:10:30") إلى ثواني إجمالية
  static parseDurationToSeconds(duration: string): number {
    const parts = duration.split(":").map((p) => parseInt(p, 10));
    let totalSeconds = 0;

    if (parts.length === 3) {
      // HH:MM:SS
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      // SS (افتراضياً إذا كانت جزء واحد)
      totalSeconds = parts[0];
    }

    return totalSeconds;
  }

  // دالة مساعدة لتحويل الثواني الإجمالية إلى تنسيق HH:MM:SS
  static formatSecondsToDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, "0");

    // يمكن تعديل التنسيق هنا حسب الرغبة (مثال: إظهار الساعات فقط إذا كانت > 0)
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      return `${pad(minutes)}:${pad(seconds)}`;
    }
  }

  // ~ Patch => /api/hackit/ctrl/course/removeStudent/course/courseId ~ Remove Student From Teacher`s Course
  static async RemoveStudentFromCourse(courseId: string, studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new NotFoundError("معرف الكورس غير صالح");
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new NotFoundError("معرف الطالب غير صالح");
    }

    const course = await Course.findById(courseId);
    if (!course) throw new NotFoundError("الكورس غير موجود");

    const student = await Student.findById(studentId);
    if (!student) throw new NotFoundError("الطالب غير موجود");

    if (!student.enrolledCourses.includes(course._id as any)) {
      throw new BadRequestError("الطالب غير مسجل في هذا الكورس");
    }

    try {
      // Update student
      await Student.findByIdAndUpdate(studentId, {
        $pull: { enrolledCourses: courseId },
      });

      // Update course
      await Course.findByIdAndUpdate(courseId, {
        $pull: { students: studentId },
      });

      return {
        message: "تم إزالة الطالب من الكورس بنجاح",
      };
    } catch (error) {
      throw error;
    }
  }
}

export { CtrlCourseService };
