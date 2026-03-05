import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AdsService } from "../services/ads.service";
import { ICloudinaryFile } from "../../../core/types/cloudinary.types";
import { createAdsSchema, updateAdsSchema } from "../schemas/ads.schema";
import { badRequest } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";

class AdsController {
  // POST /api/hackit/ctrl/ads
  createAds = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as ICloudinaryFile;

    if (!file) {
      throw badRequest("صورة الإعلان مطلوبة");
    }

    // Zod validation
    let parsed: any;
    try {
      parsed = createAdsSchema.parse({ image: file.path });
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const newAds = await AdsService.createAds(file);

    res.status(201).json({
      success: true,
      message: "تم إنشاء الإعلان بنجاح",
      ads: newAds,
    });
  });

  // GET /api/hackit/ctrl/ads
  getAllAds = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdsService.getAllAds();
    res.status(200).json(result);
  });

  // GET /api/hackit/ctrl/ads/:id
  getAdsById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ads = await AdsService.getAdsById(id);
    res.status(200).json(ads);
  });

  // PUT /api/hackit/ctrl/ads/:id
  updateAds = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = req.file as ICloudinaryFile;

    if (!file) {
      throw badRequest("صورة الإعلان مطلوبة");
    }

    // Zod validation
    let parsed: any;
    try {
      parsed = updateAdsSchema.parse({ image: file.path });
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const updatedAds = await AdsService.updateAds(id, file);

    res.status(200).json({
      success: true,
      message: "تم تحديث الإعلان بنجاح",
      ads: updatedAds,
    });
  });

  // DELETE /api/hackit/ctrl/ads/:id
  deleteAds = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await AdsService.deleteAds(id);
    res.status(200).json(result);
  });
}

export const adsController = new AdsController();
