import mongoose from "mongoose";
import { Version } from "../models/version.model";
import {
  createVersionSchema,
  updateVersionSchema,
} from "../schemas/version.schema";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";

export class CtrlVersionService {
  // ~ Get => /api/hackit/version/current
  static async getCurrentVersion() {
    const version = await Version.findOne().sort({ createdAt: -1 }).lean();

    if (!version) throw notFound("لا يوجد إصدار مضاف");

    return version;
  }

  // ~ Post => /api/hackit/ctrl/version
  static async createVersion(data: any) {
    let parsed: any;
    try {
      parsed = createVersionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const exists = await Version.findOne({ version: parsed.version });
    if (exists) throw badRequest("رقم الإصدار موجود مسبقاً");

    await Version.create(parsed);

    return { message: "تم إنشاء الإصدار بنجاح" };
  }

  // ~ Get => /api/hackit/ctrl/version
  static async getAllVersions(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [versions, total] = await Promise.all([
      Version.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("version url isBankActive createdAt updatedAt")
        .lean(),
      Version.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      versions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
      },
    };
  }

  // ~ Get => /api/hackit/ctrl/version/:id
  static async getVersionById(versionId: string) {
    if (!mongoose.isValidObjectId(versionId))
      throw badRequest("معرف الإصدار غير صالح");

    const version = await Version.findById(versionId)
      .select("version url isBankActive createdAt updatedAt")
      .lean();

    if (!version) throw notFound("الإصدار غير موجود");

    return version;
  }

  // ~ Put => /api/hackit/ctrl/version/:id
  static async updateVersion(versionId: string, data: any) {
    if (!mongoose.isValidObjectId(versionId))
      throw badRequest("معرف الإصدار غير صالح");

    let parsed: any;
    try {
      parsed = updateVersionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const updated = await Version.findByIdAndUpdate(versionId, parsed, {
      new: true,
      runValidators: true,
    });

    if (!updated) throw notFound("الإصدار غير موجود");

    return { message: "تم تحديث الإصدار بنجاح" };
  }

  // ~ Delete => /api/hackit/ctrl/version/:id
  static async deleteVersion(versionId: string) {
    if (!mongoose.isValidObjectId(versionId))
      throw badRequest("معرف الإصدار غير صالح");

    const deleted = await Version.findByIdAndDelete(versionId);
    if (!deleted) throw notFound("الإصدار غير موجود");

    const remainingVersions = await Version.countDocuments();

    return {
      message: "تم حذف الإصدار بنجاح",
      remainingVersions,
      isLastVersion: remainingVersions === 0,
    };
  }
}
