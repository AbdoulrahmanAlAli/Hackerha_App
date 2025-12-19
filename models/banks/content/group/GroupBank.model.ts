import mongoose, { Schema, Model } from "mongoose";
import joi from "joi";
import { IGroupBank } from "./dtos";

// Group Bank Schema
const GroupBankSchema = new Schema<IGroupBank>(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      ref: "Content",
      required: [true, "معرف المحتوى مطلوب"],
    },
    mainTitle: {
      type: String,
      trim: true,
    },
    totalMark: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        return ret;
      },
    },
    id: false,
  }
);

// Virtual for Questions
GroupBankSchema.virtual("questions", {
  ref: "QuestionBank",
  localField: "_id",
  foreignField: "groupBankId",
});

// Virtual for counting questions
GroupBankSchema.virtual("questionsCount", {
  ref: "QuestionBank",
  localField: "_id",
  foreignField: "groupBankId",
  count: true,
});

GroupBankSchema.virtual("questionsCount", {
  ref: "QuestionBank",
  localField: "_id",
  foreignField: "groupBankId",
  count: true,
});

// Group Model
const GroupBank: Model<IGroupBank> = mongoose.model<IGroupBank>(
  "GroupBank",
  GroupBankSchema
);

// Indexes
GroupBankSchema.index({ createdAt: -1 });

// Validation: Create Group Bank
const validateCreateGroupBank = (obj: IGroupBank): joi.ValidationResult => {
  const schema = joi.object({
    contentId: joi.string().required().messages({
      "string.empty": "معرف المحتوى مطلوب",
      "any.required": "معرف المحتوى مطلوب",
    }),
    mainTitle: joi
      .alternatives()
      .try(joi.string().trim().allow(""), joi.allow(null))
      .messages({
        "alternatives.types": "العنوان الرئيسي يجب أن يكون نصاً أو فارغاً",
      }),
    totalMark: joi
      .alternatives()
      .try(joi.number().allow(null), joi.allow(null)) // السماح بقيمة null
      .messages({
        "alternatives.types": "علامة الفروب يجب أن تكون رقماً أو فارغة",
      }),
  });

  return schema.validate(obj);
};

// Validation: Update Group Bank
const validateUpdateGroupBank = (
  obj: Partial<IGroupBank>
): joi.ValidationResult => {
  const schema = joi.object({
    contentId: joi.string().messages({
      "string.empty": "معرف المحتوى مطلوب",
    }),
    mainTitle: joi
      .alternatives()
      .try(joi.string().trim().allow(""), joi.allow(null))
      .messages({
        "alternatives.types": "العنوان الرئيسي يجب أن يكون نصاً أو فارغاً",
      }),
    totalMark: joi
      .alternatives()
      .try(joi.number().allow(null), joi.allow(null)) // السماح بقيمة null
      .messages({
        "alternatives.types": "علامة الفروب يجب أن تكون رقماً أو فارغة",
      }),
  });

  return schema.validate(obj);
};

export { GroupBank, validateCreateGroupBank, validateUpdateGroupBank };
