import mongoose, { Schema, Model } from "mongoose";
import joi from "joi";
import { IExam } from "./dtos";
import { Group } from "./group/Group.model";

// Exam Schema
const ExamSchema = new Schema<IExam>(
  {
    number: {
      type: Number,
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "معرف الكورس مطلوب"],
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
    },
    duration: {
      type: String,
      required: [true, "المدة بالدقائق مطلوبة"],
      validate: {
        validator: function (v: string) {
          // Validate time format: HH:MM or HH:MM:SS
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(v);
        },
        message: "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00",
      },
    },
  },
  { timestamps: true }
);

ExamSchema.pre("findOneAndDelete", async function (next) {
  try {
    const exam = await this.model.findOne(this.getFilter());
    if (exam) {
      // نحذف جميع الـ Groups المرتبطة بهذا الامتحان
      await Group.deleteMany({ examId: exam._id });
      console.log(`✅ تم حذف جميع المجموعات المرتبطة بالامتحان ${exam._id}`);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Exam Model
const Exam: Model<IExam> = mongoose.model<IExam>("Exam", ExamSchema);

// Indexes
ExamSchema.index({ courseId: 1 });
ExamSchema.index({ createdAt: -1 });

// Validation: Create Exam
const validateCreateExam = (obj: IExam): joi.ValidationResult => {
  const schema = joi.object({
    number: joi.number().required(),
    courseId: joi.string().required().messages({
      "string.empty": "معرف الكورس مطلوب",
      "any.required": "معرف الكورس مطلوب",
    }),
    title: joi.string().max(100).required().messages({
      "string.empty": "عنوان الامتحان مطلوب",
      "string.max": "العنوان يجب ألا يتجاوز 100 حرف",
      "any.required": "عنوان الامتحان مطلوب",
    }),
    totalMark: joi.number().required().messages({
      "number.empty": "العلامة الإجمالية مطلوبة",
      "any.required": "العلامة الإجمالية مطلوبة",
    }),
    duration: joi
      .string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .required()
      .messages({
        "string.empty": "المدة مطلوبة",
        "string.pattern.base": "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00",
        "any.required": "المدة مطلوبة",
      }),
  });

  return schema.validate(obj);
};

// Validation: Update Exam
const validateUpdateExam = (obj: Partial<IExam>): joi.ValidationResult => {
  const schema = joi.object({
    number: joi.number(),
    courseId: joi.string().messages({
      "string.empty": "معرف الكورس مطلوب",
      "any.required": "معرف الكورس مطلوب",
    }),
    title: joi.string().max(100).messages({
      "string.empty": "عنوان الامتحان مطلوب",
      "string.max": "العنوان يجب ألا يتجاوز 100 حرف",
    }),
    totalMark: joi.number().messages({
      "number.empty": "العلامة الإجمالية مطلوبة",
    }),
    duration: joi
      .string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .messages({
        "string.empty": "المدة مطلوبة",
        "string.pattern.base": "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00"
      }),
  });

  return schema.validate(obj);
};

export { Exam, validateCreateExam, validateUpdateExam };
