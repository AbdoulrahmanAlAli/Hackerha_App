import mongoose from "mongoose";
import { Course } from "../models/course.model";

import {
  createCourseSchema,
  updateCourseSchema,
  getCoursesQuerySchema,
} from "../schemas/course.schema";
import { ICloudinaryFile } from "../../../core/types/cloudinary.types";
import {
  badRequest,
  notFound,
} from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { Teacher } from "../../users/teacher/models/teacher.model";
import { Student } from "../../users/student/models/student.model";
import { Session } from "../../session/models/session.model";
import { Exam } from "../../exam/models/exam.model";
import { Actor } from "../types/course.types";
import { Question } from "../../exam/group/question/models/question.model";
import { Group } from "../../exam/group/models/group.model";

export class CtrlCourseService {
  // ~ Post => /api/hackit/ctrl/course
  static async createCourse(data: any, file: ICloudinaryFile) {
    console.log(data);
    if (!file) throw badRequest("صورة الكورس مطلوبة");

    let parsed: any;
    try {
      parsed = createCourseSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const teacher = await Teacher.findById(parsed.teacher);
    if (!teacher) throw notFound("المعلم غير موجود");

    const exists = await Course.findOne({ name: parsed.name });
    if (exists) throw badRequest("الكورس موجود بالفعل");

    if (parsed.free === true) parsed.price = 0;

    const discount = {
      dis: parsed.discount.dis,
      rate: parsed.discount.dis ? parsed.discount.rate ?? 0 : 0,
    };

    await Course.create({
      ...parsed,
      discount,
      image: file.path,
    });

    return { message: "تم إنشاء الكورس بنجاح" };
  }

  // ~ Get => /api/hackit/ctrl/course/:id ~ get single course
  static async getCourseById(courseId: string, actor: Actor) {
    if (!mongoose.isValidObjectId(courseId))
      throw badRequest("معرف الكورس غير صالح");

    const course = await Course.findById(courseId)
      .populate("teacher")
      .populate({ path: "sessions", options: { sort: { number: 1 } } })
      .populate({ path: "exams", options: { sort: { number: 1 } } })
      .populate("students", "firstName lastName phoneNumber universityNumber email")
      .lean();

    if (!course) throw notFound("الكورس غير موجود");

    const sessions = (course as any).sessions ?? [];
    const exams = (course as any).exams ?? [];

    const totalFiles = sessions.reduce(
      (t: number, s: any) => t + (Array.isArray(s?.files) ? s.files.length : 0),
      0
    );

    const firstSession = await Session.findOne({ courseId, number: 1 }).lean();
    const firstExam = await Exam.findOne({ courseId })
      .sort({ number: 1 })
      .lean();

    const activities = [
      ...sessions.map((s: any) => ({
        ...s,
        type: "session" as const,
        orderNumber: s.number,
      })),
      ...exams.map((e: any) => ({
        ...e,
        type: "exam" as const,
        orderNumber: e.number,
      })),
    ].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));

    const sessionsAndExams = activities.map(({ orderNumber, ...rest }) => rest);

    const {
      sessions: _s,
      exams: _e,
      whatsapp: whatsappField,
      ...courseWithoutArrays
    } = course as any;

    const price = (course as any).price ?? 0;
    const discount = (course as any).discount;

    const base = {
      ...courseWithoutArrays,
      studentsCount:
        ((course as any).students?.length ?? 0) +
        ((course as any).fakeCount || 0),
      sessionsCount: sessions.length,
      examsCount: exams.length,
      commentsCount: (course as any).comments?.length ?? 0,
      discountedPrice:
        discount?.dis && discount?.rate
          ? price * (1 - discount.rate / 100)
          : price,
      isDiscounted: !!discount?.dis,
      totalFiles,
      firstSession,
      firstExam,
    };

    // الطالب: يرجع isEnrolled دائماً + يخفي whatsapp و sessionsAndExams إن لم يكن مسجلاً
    if (actor.role === "student") {
      if (!actor.id) throw badRequest("معرف الطالب مطلوب");

      const student = await Student.findById(actor.id).select(
        "enrolledCourses"
      );
      if (!student) throw notFound("الطالب غير موجود");

      const isEnrolled = (student.enrolledCourses ?? []).some(
        (x: any) => x.toString() === courseId
      );

      if (!isEnrolled) return { ...base, isEnrolled };

      return { ...base, isEnrolled, sessionsAndExams, whatsapp: whatsappField };
    }

    // admin/teacher: عرض كامل
    return { ...base, sessionsAndExams, whatsapp: whatsappField };
  }

  // ~ Get => /api/hackit/ctrl/course ~ get all courses
  static async getAllCourses(query: any) {
    let parsed: any;
    try {
      parsed = getCoursesQuerySchema.parse(query);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const { name, type, hasDiscount, year, semester, createdLessThanDays } =
      parsed;
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
      .select("-__v -whatsapp -students")
      .populate("teacher")
      .lean();

    return courses.map((c: any) => ({
      ...c,
      studentsCount: (c.students?.length || 0) + (c.fakeCount || 0),
      discountedPrice:
        c.discount?.dis && c.discount?.rate
          ? c.price * (1 - c.discount.rate / 100)
          : c.price,
      isDiscounted: c.discount?.dis || false,
    }));
  }

  // ~ Put => /api/hackit/ctrl/course/:id ~ update course
  static async updateCourse(courseId: string, data: any) {
    if (!mongoose.isValidObjectId(courseId))
      throw badRequest("معرف الكورس غير صالح");

    let parsed: any;
    try {
      parsed = updateCourseSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const course = await Course.findById(courseId);
    if (!course) throw notFound("الكورس غير موجود");

    if (parsed.free === true) parsed.price = 0;
    if (parsed.free === false && parsed.price === 0)
      throw badRequest("لا يمكن أن يكون الكورس مدفوعاً وسعره صفر");

    if (parsed.discount) {
      parsed.discount = {
        dis: parsed.discount.dis ?? course.discount.dis,
        rate:
          parsed.discount.dis ?? course.discount.dis
            ? parsed.discount.rate ?? course.discount.rate ?? 0
            : 0,
      };
    }

    const updated = await Course.findByIdAndUpdate(courseId, parsed, {
      new: true,
      runValidators: true,
    }).select("-__v");
    if (!updated) throw notFound("فشل تحديث الكورس");

    return { message: "تم تحديث الكورس بنجاح" };
  }

  // ~ Delete => /api/hackit/ctrl/course/:id ~ delete course
  static async deleteCourse(courseId: string) {
    if (!mongoose.isValidObjectId(courseId))
      throw badRequest("معرف الكورس غير صالح");

    // 1) تأكد الكورس موجود
    const course = await Course.findById(courseId).select("_id");
    if (!course) throw notFound("الكورس غير موجود");

    // 2) اجلب exams IDs الخاصة بالكورس
    const exams = await Exam.find({ courseId }).select("_id").lean();
    const examIds = exams.map((e) => e._id);

    if (examIds.length) {
      // 3) اجلب group IDs لكل الامتحانات
      const groups = await Group.find({ examId: { $in: examIds } })
        .select("_id")
        .lean();
      const groupIds = groups.map((g) => g._id);

      // 4) احذف الأسئلة ثم المجموعات ثم الامتحانات
      if (groupIds.length) {
        await Question.deleteMany({ groupId: { $in: groupIds } });
        await Group.deleteMany({ _id: { $in: groupIds } });
      }

      await Exam.deleteMany({ _id: { $in: examIds } });
    }

    // 5) أخيراً احذف الكورس نفسه
    await Course.findByIdAndDelete(courseId);

    return {
      message: "تم حذف الكورس وكل الامتحانات والمجموعات والأسئلة بنجاح",
    };
  }

  // ~ Put => /api/hackit/ctrl/course/imagecourse/:id ~ update course image
  static async updateCourseImage(file: ICloudinaryFile, courseId: string) {
    if (!mongoose.isValidObjectId(courseId))
      throw badRequest("معرف الكورس غير صالح");
    if (!file) throw badRequest("صورة الكورس مطلوبة");

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { $set: { image: file.path } },
      { new: true }
    );
    if (!updated) throw notFound("فشل تحديث صورة الكورس");

    return { message: "تم تحديث صورة الكورس بنجاح" };
  }

  // PATCH /api/hackit/ctrl/course/removeStudent/course/:courseId
  static async removeStudentFromCourse(courseId: string, studentId: string) {
    if (!mongoose.isValidObjectId(courseId))
      throw notFound("معرف الكورس غير صالح");
    if (!mongoose.isValidObjectId(studentId))
      throw notFound("معرف الطالب غير صالح");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const course = await Course.findById(courseId).session(session);
      if (!course) throw notFound("الكورس غير موجود");

      const student = await Student.findById(studentId).session(session);
      if (!student) throw notFound("الطالب غير موجود");

      // تحقق أنه فعلاً مسجل
      const enrolled = student.enrolledCourses.some(
        (c) => c.toString() === courseId
      );
      if (!enrolled) throw badRequest("الطالب غير مسجل في هذا الكورس");

      // تحديث الطالب
      const studentRes = await Student.updateOne(
        { _id: studentId },
        { $pull: { enrolledCourses: courseId } },
        { session }
      );

      // تحديث الكورس
      const courseRes = await Course.updateOne(
        { _id: courseId },
        { $pull: { students: studentId } },
        { session }
      );

      // تأكيد أنه تم التعديل فعلاً (احتياطي)
      if (studentRes.modifiedCount === 0 && courseRes.modifiedCount === 0) {
        throw badRequest("لم يتم إجراء أي تعديل (ربما البيانات غير متطابقة)");
      }

      await session.commitTransaction();
      session.endSession();

      return { message: "تم إزالة الطالب من الكورس بنجاح" };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
