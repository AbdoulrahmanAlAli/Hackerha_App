import mongoose, { Schema, Model } from "mongoose";
import { IGroup } from "../types/group.types";

// Group Schema
const GroupSchema = new Schema<IGroup>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "معرف الامتحان مطلوب"],
      index: true,
    },

    mainTitle: {
      type: String,
      trim: true,
      default: null,
    },

    totalMark: {
      type: Number,
      default: null,
      min: [0, "علامة الفروب لا يمكن أن تكون أقل من 0"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: questions
GroupSchema.virtual("questions", {
  ref: "Question",
  localField: "_id",
  foreignField: "groupId",
});

// Group Model
export const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);
