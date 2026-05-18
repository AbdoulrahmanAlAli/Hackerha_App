import mongoose, { Schema, Model } from "mongoose";
import { IBank } from "../types/bank.types";

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

    // صورة البنك
    image: {
      type: String,
      required: [true, "صورة البنك مطلوبة"],
      trim: true,
    },

    // السنة
    year: {
      type: String,
      enum: [
        "السنة الأولى",
        "السنة الثانية",
        "السنة الثالثة",
        "السنة الرابعة",
        "السنة الخامسة",
      ],
      required: [true, "السنة مطلوبة"],
    },

    // الفصل
    semester: {
      type: String,
      enum: ["الفصل الأول", "الفصل الثاني"],
      required: [true, "الفصل مطلوب"],
    },

    // هل البنك متاح أم لا (القيمة الافتراضية false)
    available: {
      type: Boolean,
      default: false,  // القيمة الافتراضية
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: bankExams
BankSchema.virtual("bankExams", {
  ref: "BankExam",
  localField: "_id",
  foreignField: "bankId",
});

// Virtual: عدد الامتحانات
BankSchema.virtual("bankExamsCount", {
  ref: "BankExam",
  localField: "_id",
  foreignField: "bankId",
  count: true,
});

// Indexes
BankSchema.index({ createdAt: -1 });
BankSchema.index({ year: 1, semester: 1 });
BankSchema.index({ title: 1 });
BankSchema.index({ available: 1 }); // إضافة index لحقل available

// إنشاء أو إعادة استخدام الموديل إذا كان موجوداً
export const Bank: Model<IBank> =
  mongoose.models.Bank || mongoose.model<IBank>("Bank", BankSchema);