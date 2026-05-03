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
import { Exam } from "../../exam/models/exam.model";
import { File } from "../files/models/file.model";

export class CtrlSessionService {
  // ~ Post => /api/hackit/ctrl/sessions ~ Create Session
  static async createSession(data: CreateSessionInput) {
    let parsed: CreateSessionInput;
    try {
      parsed = createSessionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    if (!mongoose.isValidObjectId(parsed.courseId))
      throw badRequest("معرف الكورس غير صالح");

    const course = await Course.findById(data.courseId);
    if (!course) throw notFound("الكورس غير موجود");

    const existingByName = await Session.findOne({
      courseId: data.courseId,
      name: data.name,
    });
    if (existingByName) throw badRequest("جلسة بنفس الاسم موجودة بالفعل");

    const [lastSession, lastExam] = await Promise.all([
      Session.findOne({ courseId: data.courseId }).sort({ number: -1 }),
      Exam.findOne({ courseId: data.courseId }).sort({ number: -1 }),
    ]);
    const maxNumber = Math.max(lastSession?.number || 0, lastExam?.number || 0);
    const newNumber = maxNumber + 1;

    const created = await Session.create({
      ...data,
      number: newNumber,
    });

    return { message: "تم إنشاء الجلسة بنجاح" };
  }

  // ~ Get => /api/hackit/ctrl/sessions/:id ~ Get Single Session
  static async getSessionById(id: string, userId?: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الجلسة غير صالح");

    const session = await Session.findById(id).populate("files");
    if (!session) throw notFound("الجلسة غير موجودة");

    const sessionObj = session.toObject() as any;

    // Transform likes and dislikes to counts
    sessionObj.likes = sessionObj.likes?.length || 0;
    sessionObj.disLikes = sessionObj.disLikes?.length || 0;

    // One-time video token proxy
    sessionObj.video = await VideoTokenService.createVideoToken(
      id,
      session.video,
      userId,
    );

    return sessionObj;
  }

  // ~ Get => /api/hackit/ctrl/sessions/course/:courseId ~ Get Sessions By Course Id
  static async getSessionsByCourseId(courseId: string, userRole: string) {
    if (!mongoose.isValidObjectId(courseId))
      throw badRequest("معرف الكورس غير صالح");

    const course = await Course.findById(courseId);
    if (!course) throw notFound("الكورس غير موجود");

    // Build query based on user role
    let query: any = { courseId };
    
    // For students: only return available sessions
    if (userRole === 'student') {
      query.available = true;
    }
    // For admin: return all sessions (no additional filter)
    // For teacher: you might want to add similar logic

    const sessions = await Session.find(query)
      .sort({ number: 1 })
      .lean();

    // Transform each session to include counts
    const transformedSessions = sessions.map(session => ({
      ...session,
      likes: session.likes?.length || 0,
      disLikes: session.disLikes?.length || 0,
    }));

    return transformedSessions;
  }

  // ~ Put => /api/hackit/ctrl/sessions/:id  ~ Update Session
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

  // ~ Delete => /api/hackit/ctrl/sessions/:id  ~ Delete Session
  static async deleteSession(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الجلسة غير صالح");

    await File.deleteMany({ sessionId: id })

    const session = await Session.findById(id);
    if (!session) throw notFound("الجلسة غير موجودة");

    await Session.findByIdAndDelete(id);
    return { message: "تم حذف الجلسة بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/sessions/:id/like  ~ Likes Session
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

  // ~ Put => /api/hackit/ctrl/sessions/:id/dislike  ~ DisLike Session
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
