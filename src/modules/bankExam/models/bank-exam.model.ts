import mongoose, { Schema, Model } from "mongoose";
import { IBankExam } from "../types/bank-exam.types";

// Duration Regex (يدعم 00:00 و 00:00:00)
const DURATION_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Bank Exam Schema
const BankExamSchema = new Schema<IBankExam>(
  {
    number: { 
      type: Number, 
      required: true, 
      min: 1 
    },

    bankId: {
      type: Schema.Types.ObjectId,
      ref: "Bank",
      required: [true, "معرف البنك مطلوب"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "عنوان الامتحان مطلوب"],
      trim: true,
      maxlength: [100, "العنوان يجب ألا يتجاوز 100 حرف"],
    },

    totalMark: {
      type: Number,
      required: [true, "العلامة الإجمالية مطلوبة"],
      min: [0, "العلامة لا يمكن أن تكون سالباً"],
    },

    duration: {
      type: String,
      required: [true, "المدة مطلوبة"],
      validate: {
        validator: (v: string) => DURATION_REGEX.test(v),
        message: "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00",
      },
    },
    
    available: { 
      type: Boolean, 
      default: false 
    },
  },
  { 
    timestamps: true, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
  }
);

// Virtual: questions
BankExamSchema.virtual("questions", {
  ref: "SingleQuestionBank",
  localField: "_id",
  foreignField: "bankExamId",
});

// Indexes
BankExamSchema.index({ createdAt: -1 });
BankExamSchema.index({ bankId: 1, number: 1 });

// Bank Exam Model
export const BankExam: Model<IBankExam> =
  mongoose.models.BankExam || mongoose.model<IBankExam>("BankExam", BankExamSchema);