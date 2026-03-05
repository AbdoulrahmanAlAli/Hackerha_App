import mongoose, { Schema, Model } from "mongoose";
import { SocialDocument } from "../types/social.types";

// Social Schema
const SocialSchema = new Schema<SocialDocument>(
  {
    title: {
      type: String,
      required: [true, "عنوان المنصة الاجتماعية مطلوب"],
      trim: true,
      maxlength: [100, "العنوان يجب ألا يتجاوز 100 حرف"],
    },
    link: {
      type: String,
      required: [true, "رابط المنصة الاجتماعية مطلوب"],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
SocialSchema.index({ createdAt: -1 });

// Social Model
export const Social: Model<SocialDocument> = mongoose.model<SocialDocument>(
  "Social",
  SocialSchema,
);
