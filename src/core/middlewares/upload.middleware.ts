import path from "path";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import type { Request } from "express";
import { env } from "../../bootstrap/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req: Request, file: any) => {
    const ext = path.extname(file.originalname).toLowerCase();

    let resourceType: "auto" | "raw" | "video" = "auto";
    if ([".pdf", ".docx", ".xlsx", ".csv"].includes(ext)) resourceType = "raw";
    if ([".mp4", ".avi", ".mov"].includes(ext)) resourceType = "video";

    return {
      folder: "HackIt",
      public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
      resource_type: resourceType,
      allowed_formats: ["jpg", "jpeg", "png", "mp4", "avi", "mov", "pdf"],
      type: "upload",
    };
  },
});

export const upload = multer({ storage }).single("attachedFile");
