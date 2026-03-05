import mongoose, { Schema, Model } from "mongoose";
import { AdsDocument } from "../types/ads.types";

// Ads Schema
const AdsSchema = new Schema<AdsDocument>(
  {
    image: {
      type: String,
      required: [true, "صورة الإعلان مطلوبة"],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Ads Model
export const Ads: Model<AdsDocument> = mongoose.model<AdsDocument>(
  "Ads",
  AdsSchema,
);
