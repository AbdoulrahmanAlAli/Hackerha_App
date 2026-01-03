import mongoose, { Schema, Model } from "mongoose";
import { IGroup } from "../types/group.types";
import { Question } from "../../question/models/question.model";
// import { Question } from "./question.model"; // عدّل المسار حسب مشروعك

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

// Cascade delete questions when group deleted
GroupSchema.pre("findOneAndDelete", async function () {
  const group = await this.model.findOne(this.getFilter());
  if (!group) return;

  await Question.deleteMany({ groupId: group._id });
});

export const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);
