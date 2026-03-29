import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { IAnswer, ISingleQuestion } from "../types/question.types";

// Answer Schema
const AnswerSchema = new Schema<IAnswer>(
  {
    title: { type: String, required: true, trim: true },
    correct: { type: Boolean, required: true },
  },
  { _id: true }
);

// Question Schema
const SingleQuestionSchema = new Schema<ISingleQuestion>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    title: { type: String, trim: true, default: "" },
    subTitle: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    answers: { type: [AnswerSchema], required: true, default: [] },
    mark: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: "" },
    direction: {
      type: String,
      enum: ["ltr", "rtl"],
      default: "rtl",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
SingleQuestionSchema.index({ createdAt: -1 });

// Group Model
export const SingleQuestion: Model<ISingleQuestion> =
  mongoose.models.SingleQuestionSchema || mongoose.model("SingleQuestion", SingleQuestionSchema);
