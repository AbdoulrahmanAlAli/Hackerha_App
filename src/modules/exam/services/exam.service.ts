import mongoose from "mongoose";
import { Exam } from "../models/exam.model";
import { Course } from "../../course/models/course.model"; // عدّل المسار حسب مشروعك
import { Session } from "../../session/models/session.model"; // عدّل المسار حسب مشروعك

import {
  createExamSchema,
  updateExamSchema,
  CreateExamInput,
  UpdateExamInput,
} from "../schemas/exam.schema";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { Group } from "../group/models/group.model";
import { Question } from "../question/models/question.model";

export class ExamService {
  static async createExam(data: CreateExamInput) {
    let parsed: CreateExamInput;
    try {
      parsed = createExamSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // Verify course exists
    const course = await Course.findById(parsed.courseId).select("_id");
    if (!course) throw notFound("الكورس غير موجود");

    // منع تكرار الرقم داخل نفس الكورس (Exam)
    const sameExamNumber = await Exam.exists({
      courseId: parsed.courseId,
      number: parsed.number,
    });
    if (sameExamNumber) throw badRequest("الرقم موجود بالفعل");

    // منع تعارض الرقم مع Session داخل نفس الكورس
    const sameSessionNumber = await Session.exists({
      courseId: parsed.courseId,
      number: parsed.number,
    });
    if (sameSessionNumber) throw badRequest("الرقم موجود بالفعل");

    const exam = await Exam.create({
      number: parsed.number,
      courseId: parsed.courseId,
      title: parsed.title,
      totalMark: parsed.totalMark,
      duration: parsed.duration,
    });

    return { id: exam.id, message: "تم إنشاء الامتحان بنجاح" };
  }

  static async getExamById(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    const exam = await Exam.findById(id).populate("courseId", "name");
    if (!exam) throw notFound("الاختبار غير موجود");

    return exam;
  }

  static async getExamsByCourseId(courseId: string) {
    if (!mongoose.isValidObjectId(courseId)) throw badRequest("معرف غير صالح");

    // وجود الكورس (اختياري لكن مفيد)
    const course = await Course.findById(courseId).select("_id");
    if (!course) throw notFound("الكورس غير موجود");

    const exams = await Exam.find({ courseId })
      .sort({ number: 1 }) // أفضل للعرض (مثل sessions حسب number)
      .populate("courseId", "name");

    return exams;
  }

  static async updateExam(examId: string, data: UpdateExamInput) {
    if (!mongoose.isValidObjectId(examId)) throw badRequest("معرف غير صالح");

    let parsed: UpdateExamInput;
    try {
      parsed = updateExamSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const exam = await Exam.findById(examId);
    if (!exam) throw notFound("الاختبار غير موجود");

    const nextCourseId = (parsed.courseId ?? exam.courseId).toString();
    const nextNumber = parsed.number ?? exam.number;

    // إذا تغيّر الرقم أو تغيّر الكورس: لازم نتحقق من التعارض
    const numberChanged =
      parsed.number !== undefined && parsed.number !== exam.number;
    const courseChanged =
      parsed.courseId !== undefined &&
      parsed.courseId.toString() !== exam.courseId.toString();

    if (numberChanged || courseChanged) {
      const sameExamNumber = await Exam.exists({
        courseId: nextCourseId,
        number: nextNumber,
        _id: { $ne: examId },
      });
      if (sameExamNumber) throw badRequest("الرقم مستخدم بالفعل في امتحان آخر");

      const sameSessionNumber = await Session.exists({
        courseId: nextCourseId,
        number: nextNumber,
      });
      if (sameSessionNumber) throw badRequest("الرقم مستخدم بالفعل في جلسة");
    }

    // تحديث حقول بسيطة
    if (parsed.number !== undefined) exam.number = parsed.number;
    if (parsed.courseId !== undefined) exam.courseId = parsed.courseId as any;
    if (parsed.title !== undefined) exam.title = parsed.title;
    if (parsed.totalMark !== undefined) exam.totalMark = parsed.totalMark;
    if (parsed.duration !== undefined) exam.duration = parsed.duration;

    await exam.save();

    return { message: "تم تحديث الامتحان بنجاح" };
  }

  static async deleteExam(examId: string) {
    if (!mongoose.isValidObjectId(examId)) throw badRequest("معرف غير صالح");

    const exam = await Exam.findById(examId).select("_id");
    if (!exam) throw notFound("الاختبار غير موجود");

    // 1) اجلب groupIds
    const groups = await Group.find({ examId: exam._id }).select("_id").lean();
    const groupIds = groups.map((g) => g._id);

    // 2) احذف Questions ثم Groups
    if (groupIds.length) {
      await Question.deleteMany({ groupId: { $in: groupIds } });
    }
    await Group.deleteMany({ examId: exam._id });

    // 3) احذف Exam
    await Exam.findByIdAndDelete(examId);

    return { message: "تم حذف الاختبار بنجاح" };
  }
}
