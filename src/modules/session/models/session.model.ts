import mongoose, { Schema, Model } from "mongoose";
import { ISession } from "../types/session.types";

const SessionSchema = new Schema<ISession>(
  {
    number: {
      type: Number,
      required: [true, "رقم الجلسة مطلوب"],
      min: [1, "رقم الجلسة يجب أن يكون 1 أو أكثر"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "الكورس مطلوب"],
      index: true,
    },
    video: {
      type: String,
      required: [true, "رابط الفيديو مطلوب"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "اسم الجلسة مطلوب"],
      trim: true,
      maxlength: [100, "الاسم يجب ألا يتجاوز 100 حرف"],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
        default: [],
      },
    ],
    disLikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
        default: [],
      },
    ],
    note: {
      type: String,
      trim: true,
      maxlength: [500, "الملاحظات يجب ألا تتجاوز 500 حرف"],
      default: "",
    },
    duration: {
      type: String,
      required: [true, "مدة الفيديو مطلوبة"],
      trim: true,
    },
    available: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SessionSchema.virtual("files", {
  ref: "SessionFile",
  localField: "_id",
  foreignField: "sessionId",
});

// Indexes
SessionSchema.index({ createdAt: -1 });

// مهم: نفس الكورس لا يسمح بتكرار نفس رقم الجلسة
SessionSchema.index({ courseId: 1, number: 1 }, { unique: true });

// Model export (تفادي مشكلة recompile في dev)
export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
