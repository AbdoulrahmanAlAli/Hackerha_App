import mongoose, { Schema, Model } from "mongoose";
import { TeacherInvoiceDocument } from "../types/teacherInvoice.types";

// Schema
const TeacherInvoiceSchema = new Schema<TeacherInvoiceDocument>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "معرف الأستاذ مطلوب"],
      index: true,
    },

    priceTaken: {
      type: Number,
      required: [true, "المبلغ المأخوذ مطلوب"],
      min: [0, "لا يمكن أن يكون المبلغ سالباً"],
    },

    total: {
      type: Number,
      required: [true, "الإجمالي مطلوب"],
      min: [0, "لا يمكن أن يكون الإجمالي سالباً"],
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index
TeacherInvoiceSchema.index({ createdAt: -1 });

// Model
export const TeacherInvoice: Model<TeacherInvoiceDocument> = mongoose.model<TeacherInvoiceDocument>(
  "TeacherInvoice",
  TeacherInvoiceSchema
);