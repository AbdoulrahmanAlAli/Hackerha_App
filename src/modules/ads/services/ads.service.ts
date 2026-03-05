import { Ads } from "../models/ads.model";
import { ICloudinaryFile } from "../../../core/types/cloudinary.types";
import { notFound } from "../../../core/errors/httpErrors";

export class AdsService {
  // ~ Post => /api/hackit/ctrl/ads
  static async createAds(file: ICloudinaryFile) {
    const imageUrl = file.path;

    const ads = await Ads.create({
      image: imageUrl,
    });

    return ads;
  }

  // ~ Get => /api/hackit/ctrl/ads
  static async getAllAds() {
    const ads = await Ads.find().sort({ createdAt: -1 }).lean();

    return {
      ads,
    };
  }

  // ~ Get => /api/hackit/ctrl/ads/:id
  static async getAdsById(adsId: string) {
    const ads = await Ads.findById(adsId).lean();

    if (!ads) {
      throw notFound("الإعلان غير موجود");
    }

    return ads;
  }

  // ~ Put => /api/hackit/ctrl/ads/:id
  static async updateAds(id: string, file: ICloudinaryFile) {
    const imageUrl = file.path;

    const ads = await Ads.findByIdAndUpdate(
      id,
      { image: imageUrl },
      { new: true, runValidators: true },
    );

    if (!ads) {
      throw notFound("الإعلان غير موجود");
    }

    return ads;
  }

  // ~ Delete => /api/hackit/ctrl/ads/:id
  static async deleteAds(adsId: string) {
    const ads = await Ads.findByIdAndDelete(adsId);

    if (!ads) {
      throw notFound("الإعلان غير موجود");
    }

    return { success: true, message: "تم حذف الإعلان بنجاح" };
  }
}
