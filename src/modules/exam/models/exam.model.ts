import mongoose, { Schema, Model } from "mongoose";
import { IExam } from "../types/exam.types";

// Duration Regex
const DURATION_REGEX = /^([0-5]?[0-9]):([0-5][0-9])$/;

// Exam Schema
const ExamSchema = new Schema<IExam>(
  {
    number: { type: Number, required: true, min: 1 },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "معرف الكورس مطلوب"],
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
        message: "المدة يجب أن تكون بالتنسيق 00:00",
      },
    },
    available: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: groups
ExamSchema.virtual("questions", {
  ref: "SingleQuestion",
  localField: "_id",
  foreignField: "examId",
});


// Indexes
ExamSchema.index({ createdAt: -1 });
ExamSchema.index({ courseId: 1, number: 1 });

// Exam Model
export const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);
