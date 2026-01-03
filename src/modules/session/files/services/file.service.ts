import mongoose from "mongoose";
import { File } from "../models/file.model";
import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import { createFileSchema, updateFileSchema } from "../schemas/file.schema";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";
import { Course } from "../../../course/models/course.model";
import { Session } from "../../models/session.model";
import { CreateFileInput, UpdateFileInput } from "../types/file.types";



export class FileService {
  static async createFile(data: CreateFileInput) {
    let parsed: CreateFileInput;
    try {
      parsed = createFileSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // تحقق الكورس
    const course = await Course.findById(parsed.courseId);
    if (!course) throw notFound("الكورس غير موجود");

    // تحقق الجلسة + أنها تابعة لنفس الكورس
    const session = await Session.findOne({
      _id: parsed.sessionId,
      courseId: parsed.courseId,
    });
    if (!session) throw notFound("الجلسة غير موجودة أو لا تنتمي لهذا الكورس");

    // إنشاء الملف (PDF فقط)
    const created = await File.create({
      url: parsed.url,
      type: "pdf",
      name: parsed.name,
      courseId: parsed.courseId,
      sessionId: parsed.sessionId,
      description: parsed.description ?? "",
    });

    // ربط الملف بالجلسة (حسب الإدخال = push)
    await Session.findByIdAndUpdate(parsed.sessionId, {
      $push: { files: created._id },
    });

    const populated = await File.findById(created._id)
      .populate("courseId")
      .populate("sessionId");

    return { message: "تم إنشاء الملف بنجاح", file: populated };
  }

  static async getFileById(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الملف غير صالح");

    const file = await File.findById(id)
      .populate("courseId")
      .populate("sessionId");

    if (!file) throw notFound("الملف غير موجود");
    return file;
  }

  static async getFilesBySessionId(sessionId: string) {
    if (!mongoose.isValidObjectId(sessionId))
      throw badRequest("معرف الجلسة غير صالح");

    // ترتيب الإدخال: استخدم ترتيب ids الموجود في Session.files
    const session = await Session.findById(sessionId).select("files");
    if (!session) throw notFound("الجلسة غير موجودة");

    if (!session.files?.length) return [];

    const files = await File.find({ _id: { $in: session.files } })
      .populate("courseId")
      .populate("sessionId")
      .lean();

    // إعادة ترتيب النتائج حسب session.files
    const map = new Map(files.map((f: any) => [String(f._id), f]));
    return session.files
      .map((fid: any) => map.get(String(fid)))
      .filter(Boolean);
  }

  static async getFilesByCourseId(courseId: string) {
    if (!mongoose.isValidObjectId(courseId))
      throw badRequest("معرف الكورس غير صالح");

    // لا يوجد ترتيب إدخال موحد على مستوى الكورس، سنعيدها بالأحدث
    const files = await File.find({ courseId })
      .populate("courseId")
      .populate("sessionId")
      .sort({ createdAt: -1 });

    return files;
  }

  static async updateFile(id: string, data: UpdateFileInput) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الملف غير صالح");

    let parsed: UpdateFileInput;
    try {
      parsed = updateFileSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const file = await File.findById(id);
    if (!file) throw notFound("الملف غير موجود");

    if (parsed.name !== undefined) file.name = parsed.name;
    if (parsed.description !== undefined) file.description = parsed.description;

    await file.save();

    const populated = await File.findById(id)
      .populate("courseId", "name")
      .populate("sessionId", "name number");

    return { message: "تم تحديث الملف بنجاح", file: populated };
  }

  static async deleteFile(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف الملف غير صالح");

    const file = await File.findById(id);
    if (!file) throw notFound("الملف غير موجود");

    // حذف المرجع من الجلسة
    await Session.findByIdAndUpdate(file.sessionId, {
      $pull: { files: file._id },
    });

    await File.findByIdAndDelete(id);

    return { message: "تم حذف الملف بنجاح" };
  }

  static async deleteFilesBySessionId(sessionId: string) {
    if (!mongoose.isValidObjectId(sessionId))
      throw badRequest("معرف الجلسة غير صالح");

    const session = await Session.findById(sessionId);
    if (!session) throw notFound("الجلسة غير موجودة");

    const result = await File.deleteMany({ sessionId });

    // تفريغ مصفوفة الملفات في الجلسة
    session.files = [];
    await session.save();

    return {
      message: "تم حذف جميع ملفات الجلسة بنجاح",
      deletedCount: result.deletedCount ?? 0,
    };
  }
}
