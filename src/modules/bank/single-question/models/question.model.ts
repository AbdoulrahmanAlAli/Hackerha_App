import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { IAnswerBank, ISingleQuestionBank } from "../types/question.types";

// Answer Schema
const AnswerBankSchema = new Schema<IAnswerBank>(
  {
    title: { type: String, required: true, trim: true },
    correct: { type: Boolean, required: true },
  },
  { _id: true }
);

// Question Schema
const SingleQuestionBankSchema = new Schema<ISingleQuestionBank>(
  {
    bankId: {
      type: Schema.Types.ObjectId,
      ref: "Bank",
      required: true,
      index: true,
    },
    number: { type: Number, default: 0 },
    title: { type: String, trim: true, default: "" },
    subTitle: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    answers: { type: [AnswerBankSchema], required: true, default: [] },
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
SingleQuestionBankSchema.index({ createdAt: -1 });

// Group Model
export const SingleQuestionBank: Model<ISingleQuestionBank> =
  mongoose.models.SingleQuestionBankSchema || mongoose.model("SingleQuestionBank", SingleQuestionBankSchema);
