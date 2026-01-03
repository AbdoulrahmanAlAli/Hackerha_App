import mongoose from "mongoose";
import {
  CreateSessionInput,
  createSessionSchema,
  UpdateSessionInput,
  updateSessionSchema,
} from "../schemas/session.schema";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { Course } from "../../course/models/course.model";
import { Session } from "../models/session.model";
import { VideoTokenService } from "../security_video/videoToken.service";

export class CtrlSessionService {
  // ===== Create (Admin) =====
  static async createSession(data: CreateSessionInput) {
    let parsed: CreateSessionInput;
    try {
      parsed = createSessionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    if (!mongoose.isValidObjectId(parsed.courseId))
      throw badRequest("معرف الكورس غير صالح");

    const course = await Course.findById(parsed.courseId);
    if (!course) throw notFound("الكورس غير موجود");

    // ✅ إصلاح خطأ القديم: كان يستخدم find() ثم يتحقق !sessionHave (وهذا دائمًا false)
    const existingByName = await Session.findOne({
      courseId: parsed.courseId,
      name: parsed.name,
    });
    if (existingByName) throw badRequest("الجلسة موجودة بالفعل");

    // رقم الجلسة يجب أن يكون فريد داخل نفس الكورس + لا يتعارض مع exam.number
    const [sessionWithSameNumber] = await Promise.all([
      Session.findOne({ courseId: parsed.courseId, number: parsed.number }),
    ]);

    if (sessionWithSameNumber) throw badRequest("الرقم موجود بالفعل");

    const created = await Session.create(parsed);
    if (!created) throw badRequest("فشل إنشاء الجلسة");

    return { message: "تم إنشاء الجلسة بنجاح" };
  }

  // ===== Read (Public) =====
  static async getSessionById(id: string, userId?: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الجلسة غير صالح");

    const session = await Session.findById(id).populate("files");
    if (!session) throw notFound("الجلسة غير موجودة");

    const sessionObj = session.toObject() as any;

    // One-time video token proxy (نفس منطق القديم)
    sessionObj.video = await VideoTokenService.createVideoToken(
      id,
      session.video,
      userId
    );

    return sessionObj;
  }

  static async getSessionsByCourseId(courseId: string) {
    if (!mongoose.isValidObjectId(courseId))
      throw badRequest("معرف الكورس غير صالح");

    const course = await Course.findById(courseId);
    if (!course) throw notFound("الكورس غير موجود");

    return Session.find({ courseId }).sort({ number: 1 });
  }

  // ===== Update (Admin) =====
  static async updateSession(id: string, data: UpdateSessionInput) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الجلسة غير صالح");

    let parsed: UpdateSessionInput;
    try {
      parsed = updateSessionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const session = await Session.findById(id);
    if (!session) throw notFound("الجلسة غير موجودة");

    // تحديد courseId الهدف (لو تم تغييره أو لا)
    const targetCourseId = parsed.courseId ?? session.courseId?.toString();
    if (!targetCourseId || !mongoose.isValidObjectId(targetCourseId))
      throw badRequest("معرف الكورس غير صالح");

    // إذا تم تغيير رقم الجلسة: نضمن عدم التعارض داخل نفس الكورس ومع exams
    // if (parsed.number !== undefined && parsed.number !== session.number) {
    //   const [otherSession, examWithSameNumber] = await Promise.all([
    //     Session.findOne({
    //       _id: { $ne: session._id },
    //       courseId: targetCourseId,
    //       number: parsed.number,
    //     }),
    //     Exam.findOne({ courseId: targetCourseId, number: parsed.number }),
    //   ]);

    //   if (otherSession) throw badRequest("الرقم مستخدم بالفعل في جلسة أخرى");
    //   if (examWithSameNumber) throw badRequest("الرقم مستخدم بالفعل في امتحان");
    // }

    // تحديث الحقول (ببساطة)
    if (parsed.number !== undefined) session.number = parsed.number;
    if (parsed.courseId !== undefined)
      session.courseId = parsed.courseId as any;
    if (parsed.video !== undefined) session.video = parsed.video;
    if (parsed.name !== undefined) session.name = parsed.name;
    if (parsed.note !== undefined) session.note = parsed.note;
    if (parsed.duration !== undefined) session.duration = parsed.duration;
    if (parsed.available !== undefined) session.available = parsed.available;

    await session.save();
    return { message: "تم تحديث الجلسة بنجاح" };
  }

  // ===== Delete (Admin) =====
  static async deleteSession(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الجلسة غير صالح");

    const session = await Session.findById(id);
    if (!session) throw notFound("الجلسة غير موجودة");

    await Session.findByIdAndDelete(id);
    return { message: "تم حذف الجلسة بنجاح" };
  }

  // ===== Like/Dislike (Student عادة) - نفس القديم (اختياري) =====
  static async likeSession(sessionId: string, studentId: string) {
    if (!mongoose.isValidObjectId(sessionId))
      throw badRequest("معرف الجلسة غير صالح");
    if (!mongoose.isValidObjectId(studentId))
      throw badRequest("معرف الطالب غير صالح");

    const session = await Session.findById(sessionId);
    if (!session) throw notFound("الجلسة غير موجودة");

    const sid = new mongoose.Types.ObjectId(studentId);

    const liked = session.likes.some((id) => id.equals(sid));
    if (liked) {
      session.likes = session.likes.filter((id) => !id.equals(sid));
      await session.save();
      return { message: "تم إزالة الإعجاب بالجلسة" };
    }

    session.disLikes = session.disLikes.filter((id) => !id.equals(sid));
    session.likes.push(sid);
    await session.save();
    return { message: "تم الإعجاب بالجلسة بنجاح" };
  }

  static async dislikeSession(sessionId: string, studentId: string) {
    if (!mongoose.isValidObjectId(sessionId))
      throw badRequest("معرف الجلسة غير صالح");
    if (!mongoose.isValidObjectId(studentId))
      throw badRequest("معرف الطالب غير صالح");

    const session = await Session.findById(sessionId);
    if (!session) throw notFound("الجلسة غير موجودة");

    const sid = new mongoose.Types.ObjectId(studentId);

    const disliked = session.disLikes.some((id) => id.equals(sid));
    if (disliked) {
      session.disLikes = session.disLikes.filter((id) => !id.equals(sid));
      await session.save();
      return { message: "تم إزالة كره الجلسة" };
    }

    session.likes = session.likes.filter((id) => !id.equals(sid));
    session.disLikes.push(sid);
    await session.save();
    return { message: "تم كره الجلسة بنجاح" };
  }
}
