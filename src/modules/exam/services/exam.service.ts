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

    const course = await Course.findById(data.courseId);
    if (!course) throw notFound("الكورس غير موجود");

    const [lastSession, lastExam] = await Promise.all([
      Session.findOne({ courseId: data.courseId }).sort({ number: -1 }),
      Exam.findOne({ courseId: data.courseId }).sort({ number: -1 }),
    ]);
    const maxNumber = Math.max(lastSession?.number || 0, lastExam?.number || 0);
    const newNumber = maxNumber + 1;

    const exam = await Exam.create({
      ...data,
      number: newNumber,
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
