import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { IAnswer, IQuestion } from "../types/question.types";

const AnswerSchema = new Schema<IAnswer>(
  {
    title: { type: String, required: true, trim: true },
    correct: { type: Boolean, required: true },
  },
  { _id: true }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
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

QuestionSchema.index({ createdAt: -1 });

export type QuestionDocument = InferSchemaType<typeof QuestionSchema>;

export const Question: Model<QuestionDocument> =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);
