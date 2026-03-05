import mongoose from "mongoose";
import { Social } from "../models/social.model";
import { CreateSocialInput, UpdateSocialInput } from "../schemas/social.schema";
import { badRequest, notFound } from "../../../core/errors/httpErrors";

export class SocialService {
  // ~ Post => /api/hackit/ctrl/social
  static async createSocial(socialData: CreateSocialInput) {
    // Check if social media with same title already exists (case insensitive)
    const existingSocial = await Social.findOne({
      title: { $regex: new RegExp(`^${socialData.title}$`, "i") },
    });

    if (existingSocial) {
      throw badRequest("منصة اجتماعية بهذا الاسم موجودة بالفعل");
    }

    const social = await Social.create(socialData);

    return { message: "تم إنشاء المنصة الاجتماعية بنجاح", data: social };
  }

  // ~ Get => /api/hackit/ctrl/social/:id
  static async getSocialById(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw badRequest("معرف المنصة الاجتماعية غير صالح");
    }

    const social = await Social.findById(id);
    if (!social) throw notFound("المنصة الاجتماعية غير موجودة");

    return social;
  }

  // ~ Get => /api/hackit/ctrl/social
  static async getAllSocial() {
    const socials = await Social.find().sort({ createdAt: -1 });
    return socials;
  }

  // ~ Put => /api/hackit/ctrl/social/:id
  static async updateSocial(id: string, socialData: UpdateSocialInput) {
    if (!mongoose.isValidObjectId(id)) {
      throw badRequest("معرف المنصة الاجتماعية غير صالح");
    }

    // Check if social media exists
    const social = await Social.findById(id);
    if (!social) throw notFound("المنصة الاجتماعية غير موجودة");

    // Check for duplicate title if title is being updated
    if (socialData.title && socialData.title !== social.title) {
      const existingSocial = await Social.findOne({
        title: { $regex: new RegExp(`^${socialData.title}$`, "i") },
        _id: { $ne: id },
      });

      if (existingSocial) {
        throw badRequest("منصة اجتماعية بهذا الاسم موجودة بالفعل");
      }
    }

    const updatedSocial = await Social.findByIdAndUpdate(id, socialData, {
      new: true,
      runValidators: true,
    });

    if (!updatedSocial) throw notFound("فشل تحديث المنصة الاجتماعية");

    return { message: "تم تحديث المنصة الاجتماعية بنجاح", data: updatedSocial };
  }

  // ~ Delete => /api/hackit/ctrl/social/:id
  static async deleteSocial(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw badRequest("معرف المنصة الاجتماعية غير صالح");
    }

    const social = await Social.findByIdAndDelete(id);
    if (!social) throw notFound("المنصة الاجتماعية غير موجودة");

    return { message: "تم حذف المنصة الاجتماعية بنجاح" };
  }
}
