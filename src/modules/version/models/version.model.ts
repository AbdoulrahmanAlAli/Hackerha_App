import mongoose, { Schema, Model } from "mongoose";
import { VersionDocument } from "../types/version.types";

// ===== Version Schema =====
const VersionSchema = new Schema<VersionDocument>(
  {
    version: {
      type: String,
      required: [true, "رقم الإصدار مطلوب"],
      trim: true,
    },

    url: {
      type: String,
      required: [true, "رابط التحميل مطلوب"],
      trim: true,
    },

    isBankActive: {
      type: Boolean,
      required: [true, "حالة البنك مطلوبة"],
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ===== Model =====
export const Version: Model<VersionDocument> =
  mongoose.model<VersionDocument>("Version", VersionSchema);
