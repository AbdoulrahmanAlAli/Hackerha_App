import mongoose, { Schema, Model } from "mongoose";
import joi from "joi";
import bcrypt from "bcrypt";
import { ITeacher, IOtp } from "./dtos";

// Teacher Schema
const TeacherSchema = new Schema<ITeacher>(
  {
    profilePhoto: {
      type: String,
      default:
        "https://i.postimg.cc/JzCB3CDX/Profile-Picture-Container-(2).png",
      required: true,
    },
    firstName: {
      type: String,
      required: [true, "الاسم مطلوب"],
      trim: true,
      maxlength: [100, "الاسم يجب ألا يتجاوز 100 حرف"],
    },
    lastName: {
      type: String,
      required: [true, "الاسم الاحير مطلوب"],
      trim: true,
      maxlength: [100, "الاسم الاحير يجب ألا يتجاوز 100 حرف"],
    },
    phoneNumber: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      trim: true,
      validate: {
        validator: (v) => /^09[0-9]{8}$/.test(v),
        message: (props) =>
          `${props.value} ليس رقم هاتف صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.`,
      },
    },
    gender: {
      type: String,
      enum: {
        values: ["ذكر", "انثى"],
        message: "يحب أن يكون ذكر أو انثى",
      },
      required: [true, "نوع الجنس مطلوب"],
    },
    birth: {
      type: Date,
      required: [true, "تاريخ الميلاد مطلوب"],
    },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      trim: true,
      unique: true,
      minlength: [3, "البريد الإلكتروني يجب أن يكون على الأقل حرفين"],
      maxlength: [100, "البريد الإلكتروني يجب ألا يتجاوز 100 حرف"],
    },
    password: {
      type: String,
      required: [true, "كلمة السر مطلوبة"],
      trim: true,
      minlength: [8, "كلمة السر يجب أن يكون على الأقل 8 أحرف"],
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    otp: {
      type: String,
      length: 5,
    },
    available: {
      type: Boolean,
      default: false,
    },
    suspended: {
      type: Boolean,
      default: false,
    },
    resetPass: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: "",
    },
    suspensionEnd: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Password encryption
TeacherSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
TeacherSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Teacher Model
const Teacher: Model<ITeacher> = mongoose.model<ITeacher>(
  "Teacher",
  TeacherSchema
);

// Teacher Indexes
TeacherSchema.index({ createdAt: -1 });

// Validation Check Otp
const validationOtp = (obj: IOtp): joi.ValidationResult => {
  const schema = joi.object({
    otp: joi.string().length(5).required().messages({
      "string.empty": "لا يمكن أن يكون فارغاً",
      "any.required": "مطلوب",
    }),
  });
  return schema.validate(obj);
};

// Validation Create Teacher
const validateCreateTeacher = (obj: ITeacher): joi.ValidationResult => {
  const schema = joi.object({
    firstName: joi.string().max(100).required().messages({
      "string.empty": "الاسم مطلوب",
      "string.max": "الاسم يجب ألا يتجاوز 100 حرف",
      "any.required": "الاسم مطلوب",
    }),
    lastName: joi.string().max(100).required().messages({
      "string.empty": "الاسم الاحير مطلوب",
      "string.max": "الاسم الاحير يجب ألا يتجاوز 100 حرف",
      "any.required": "الاسم الاحير مطلوب",
    }),
    phoneNumber: joi
      .string()
      .pattern(/^09[0-9]{8}$/)
      .required()
      .messages({
        "string.pattern.base":
          "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.",
        "string.empty": "رقم الهاتف مطلوب",
        "any.required": "رقم الهاتف مطلوب",
      }),
    gender: joi.string().valid("ذكر", "انثى").required().messages({
      "any.only": "يحب أن يكون ذكر أو انثى",
      "any.required": "نوع الجنس مطلوب",
    }),
    birth: joi.date().required().messages({
      "date.base": "تاريخ الميلاد غير صالح",
      "any.required": "تاريخ الميلاد مطلوب",
    }),
    email: joi.string().email().min(3).max(100).required().messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
      "string.min": "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف",
      "string.max": "البريد الإلكتروني يجب ألا يتجاوز 100 حرف",
      "any.required": "البريد الإلكتروني مطلوب",
    }),
    about: joi.string().trim(),
    password: joi.string().min(8).required().messages({
      "string.min": "كلمة السر يجب أن تكون على الأقل 8 أحرف",
      "string.empty": "كلمة السر مطلوبة",
      "any.required": "كلمة السر مطلوبة",
    }),
  });

  return schema.validate(obj);
};

// Validation Login Teacher
const validateLoginTeacher = (obj: ITeacher): joi.ValidationResult => {
  const schema = joi.object({
    email: joi.string().email().min(3).max(100).required().messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
      "string.min": "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف",
      "string.max": "البريد الإلكتروني يجب ألا يتجاوز 100 حرف",
      "any.required": "البريد الإلكتروني مطلوب",
    }),
    password: joi.string().min(8).required().messages({
      "string.min": "كلمة السر يجب أن تكون على الأقل 8 أحرف",
      "string.empty": "كلمة السر مطلوبة",
      "any.required": "كلمة السر مطلوبة",
    }),
  });

  return schema.validate(obj);
};

// Validation Send Email
const validateSendEmail = (obj: ITeacher): joi.ValidationResult => {
  const schema = joi.object({
    email: joi.string().email().min(3).max(100).required().messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
      "string.min": "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف",
      "string.max": "البريد الإلكتروني يجب ألا يتجاوز 100 حرف",
      "any.required": "البريد الإلكتروني مطلوب",
    }),
  });

  return schema.validate(obj);
};

// Validation Reset Password
const validateResetPassword = (obj: ITeacher): joi.ValidationResult => {
  const schema = joi.object({
    otp: joi.string().length(5).required().messages({
      "string.empty": "لا يمكن أن يكون فارغاً",
      "any.required": "مطلوب",
    }),
  });

  return schema.validate(obj);
};

// Validation Password
const validatePassword = (obj: ITeacher): joi.ValidationResult => {
  const schema = joi.object({
    password: joi.string().min(8).required().messages({
      "string.min": "كلمة السر يجب أن تكون على الأقل 8 أحرف",
      "string.empty": "كلمة السر مطلوبة",
      "any.required": "كلمة السر مطلوبة",
    }),
  });

  return schema.validate(obj);
};

// Validation Update Teacher
const validateUpdateTeacher = (
  obj: Partial<ITeacher>
): joi.ValidationResult => {
  const schema = joi.object({
    firstName: joi.string().max(100).required().messages({
      "string.empty": "الاسم مطلوب",
      "string.max": "الاسم يجب ألا يتجاوز 100 حرف",
    }),
    lastName: joi.string().max(100).required().messages({
      "string.empty": "الاسم الاحير مطلوب",
      "string.max": "الاسم الاحير يجب ألا يتجاوز 100 حرف",
    }),
    phoneNumber: joi
      .string()
      .pattern(/^09[0-9]{8}$/)
      .messages({
        "string.pattern.base":
          "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.",
        "string.empty": "رقم الهاتف مطلوب",
      }),
    profilePhoto: joi.string().uri().messages({
      "string.uri": "يجب أن يكون رابط الصورة صحيحاً",
    }),
    about: joi.string().trim(),
  });

  return schema.validate(obj);
};

// Validation Update Important Teacher
const validateUpdateImportantTeacher = (
  obj: Partial<ITeacher>
): joi.ValidationResult => {
  const schema = joi.object({
    firstName: joi.string().max(100).required().messages({
      "string.empty": "الاسم مطلوب",
      "string.max": "الاسم يجب ألا يتجاوز 100 حرف",
    }),
    lastName: joi.string().max(100).required().messages({
      "string.empty": "الاسم الاحير مطلوب",
      "string.max": "الاسم الاحير يجب ألا يتجاوز 100 حرف",
    }),
    phoneNumber: joi
      .string()
      .pattern(/^09[0-9]{8}$/)
      .messages({
        "string.pattern.base":
          "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.",
        "string.empty": "رقم الهاتف مطلوب",
      }),
    birth: joi.date().messages({
      "date.base": "تاريخ الميلاد غير صالح",
    }),
    email: joi.string().email().min(3).max(100).messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
      "string.min": "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف",
      "string.max": "البريد الإلكتروني يجب ألا يتجاوز 100 حرف",
    }),
  });

  return schema.validate(obj);
};

// Validation Update Suspended Teacher
const validateUpdateSuspendedTeacher = (
  obj: Partial<ITeacher>
): joi.ValidationResult => {
  const schema = joi.object({
    suspended: joi.boolean().required().messages({
      "any.required": "عملية التقييد مطلوبة",
    }),
    suspensionReason: joi.string().required().messages({
      "any.required": "سبب التقييد مطلوب",
    }),
    suspensionEnd: joi.date().required().messages({
      "date.base": "تاريخ انتهاء التقييد غير صالح",
      "any.required": "تاريخ انتهاء التقييد مطلوب",
    }),
  });

  return schema.validate(obj);
};

export {
  Teacher,
  validationOtp,
  validateCreateTeacher,
  validateUpdateTeacher,
  validateLoginTeacher,
  validateSendEmail,
  validateResetPassword,
  validatePassword,
  validateUpdateSuspendedTeacher,
  validateUpdateImportantTeacher,
};
