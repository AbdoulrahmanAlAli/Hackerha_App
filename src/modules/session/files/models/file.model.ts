import mongoose, { Schema, Model } from "mongoose";
import { IFile } from "../types/file.types";

const FileSchema = new Schema<IFile>(
  {
    url: {
      type: String,
      required: [true, "رابط الملف مطلوب"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "اسم الملف مطلوب"],
      trim: true,
      maxlength: [100, "اسم الملف يجب ألا يتجاوز 100 حرف"],
    },
    type: {
      type: String,
      enum: {
        values: ["pdf"],
        message: "نوع الملف غير مدعوم",
      },
      default: "pdf",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "معرف الكورس مطلوب"],
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "معرف الجلسة مطلوب"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "الوصف يجب ألا يتجاوز 500 حرف"],
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes (بدون تكرار)
FileSchema.index({ createdAt: -1 });

export const File: Model<IFile> = mongoose.model<IFile>("SessionFile", FileSchema);
