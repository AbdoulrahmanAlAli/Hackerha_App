import mongoose, { Schema, Model } from "mongoose";
import { IBank } from "../types/bank.types";

// Regex للتحقق من صيغة المدة
const DURATION_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

// PDF URL Regex (optional, can be handled by validator)
const PDF_URL_REGEX = /\.pdf$/i;

// Schema الخاص بالـ Bank
const BankSchema = new Schema<IBank>(
  {
    // عنوان البنك
    title: {
      type: String,
      required: [true, "عنوان البنك مطلوب"],
      trim: true,
      maxlength: [100, "العنوان يجب ألا يتجاوز 100 حرف"],
    },

    // العلامة الكلية
    totalMark: {
      type: Number,
      required: [true, "العلامة الإجمالية مطلوبة"],
      min: [0, "العلامة لا يمكن أن تكون سالباً"],
    },

    // مدة البنك بصيغة 00:00 أو 00:00:00
    duration: {
      type: String,
      required: [true, "المدة مطلوبة"],
      validate: {
        validator: (v: string) => DURATION_REGEX.test(v),
        message: "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00",
      },
    },

    // هل البنك متاح أم لا
    available: {
      type: Boolean,
      default: false,
    },

    pdfUrl: {
      type: String,
      required: [true, "ملف PDF مطلوب"],
      validate: {
        validator: (v: string) => PDF_URL_REGEX.test(v),
        message: "الملف يجب أن يكون بصيغة PDF",
      },
    },
  },
  {
    // timestamps يضيف createdAt و updatedAt تلقائياً
    timestamps: true,

    // تفعيل virtuals عند التحويل إلى JSON أو Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index للفرز حسب الأحدث
BankSchema.index({ createdAt: -1 });

// إنشاء أو إعادة استخدام الموديل إذا كان موجوداً
export const Bank: Model<IBank> =
  mongoose.models.Bank || mongoose.model<IBank>("Bank", BankSchema);