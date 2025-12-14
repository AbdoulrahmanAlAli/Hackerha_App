import mongoose, { Schema, Model } from "mongoose";
import joi from "joi";
import { IGroup } from "./dtos";
import { Question } from "../question/Question.model";

// Group Schema
const GroupSchema = new Schema<IGroup>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "معرف الامتحان مطلوب"],
    },
    mainTitle: {
      type: String,
      trim: true,
    },
    totalMark: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for Questions
GroupSchema.virtual("questions", {
  ref: "Question",
  localField: "_id",
  foreignField: "groupId",
});

GroupSchema.pre("findOneAndDelete", async function (next) {
  try {
    const group = await this.model.findOne(this.getFilter());
    if (group) {
      // نحذف جميع الـ Questions المرتبطة بهذه المجموعة
      await Question.deleteMany({ groupId: group._id });
      console.log(`✅ تم حذف جميع الأسئلة المرتبطة بالمجموعة ${group._id}`);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Group Model
const Group: Model<IGroup> = mongoose.model<IGroup>("Group", GroupSchema);

// Indexes
GroupSchema.index({ createdAt: -1 });

// Validation: Create Group
const validateCreateGroup = (obj: IGroup): joi.ValidationResult => {
  const schema = joi.object({
    examId: joi.string().required().messages({
      "string.empty": "معرف الامتحان مطلوب",
      "any.required": "معرف الامتحان مطلوب",
    }),
    mainTitle: joi
      .alternatives()
      .try(joi.string().trim().allow(""), joi.allow(null))
      .messages({
        "alternatives.types": "العنوان الرئيسي يجب أن يكون نصاً أو فارغاً",
      }),
    totalMark: joi.number().required().messages({
      "number.empty": "علامة الفروب مطلوبة",
    }),
  });

  return schema.validate(obj);
};

// Validation: Update Group
const validateUpdateGroup = (obj: Partial<IGroup>): joi.ValidationResult => {
  const schema = joi.object({
    examId: joi.string().messages({
      "string.empty": "معرف الامتحان مطلوب",
    }),
    mainTitle: joi
      .alternatives()
      .try(joi.string().trim().allow(""), joi.allow(null))
      .messages({
        "alternatives.types": "العنوان الرئيسي يجب أن يكون نصاً أو فارغاً",
      }),
    totalMark: joi.number().messages({
      "number.empty": "علامة الفروب مطلوبة",
    }),
  });

  return schema.validate(obj);
};

export { Group, validateCreateGroup, validateUpdateGroup };
