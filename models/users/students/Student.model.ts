import mongoose, { Schema, Model } from "mongoose";
import joi from "joi";
import { IOtp, IStudent } from "./dtos";
import bcrypt from "bcrypt";

// Student Schema
const StudentSchema = new Schema<IStudent>(
  {
    profilePhoto: {
      type: String,
      default:
        "https://i.postimg.cc/JzCB3CDX/Profile-Picture-Container-(2).pngg",
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
    },
    academicYear: {
      type: String,
      enum: {
        values: [
          "السنة الأولى",
          "السنة الثانية",
          "السنة الثالثة",
          "السنة الرابعة",
          "السنة الخامسة",
        ],
        message: "يجب ان يكون من السنة الاولى الى السنة الخامسة",
      },
      required: [true, "السنة الدراسية مطلوبة"],
    },
    universityNumber: {
      type: Number,
      required: [true, "الرقم الجامعي مطلوب"],
      trim: true,
    },
    gender: {
      type: String,
      enum: {
        values: ["ذكر", "أنثى"],
        message: "يحب أن يكون ذكر أو أنثى",
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
      minlength: [3, "البريد الإلكتروني يجب أن يكون على الأقل حرفين"],
      maxlength: [100, "البريد الإلكتروني يجب ألا يتجاوز 100 حرف"],
    },
    password: {
      type: String,
      required: [true, "كلمة السر مطلوبة"],
      trim: true,
      minlength: [8, "كلمة السر يجب أن يكون على الأقل 8 أحرف"],
    },
    otp: { type: String, length: 5 },
    fcmToken: {
      type: String,
      default: null,
    },
    device_id: {
      type: String,
      required: [true, "device_Id is required"],
    },
    device_id_reset: {
      type: Boolean,
      default: false,
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
    suspensionReason: String,
    favoriteCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        default: [],
      },
    ],
    favoriteSessions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Session",
        default: [],
      },
    ],
    favoriteBank: [
      {
        type: Schema.Types.ObjectId,
        ref: "Bank",
        default: [],
      },
    ],
    enrolledCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        default: [],
      },
    ],
    banks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Bank",
        default: [],
      },
    ],
    contents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Content",
        default: [],
      },
    ],
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        default: [],
      },
    ],
    sessions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Session",
        default: [],
      },
    ],
    exams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Session",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Password encryption
StudentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Student Model
const Student: Model<IStudent> = mongoose.model<IStudent>(
  "Student",
  StudentSchema
);

// Student Indexes
StudentSchema.index({ createdAt: -1 });
StudentSchema.index({ banks: 1 });
StudentSchema.index({ contents: 1 });

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

// Validation Create Student
const validateCreateStudent = (obj: IStudent): joi.ValidationResult => {
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
    phoneNumber: joi.string().required().messages({
      "string.empty": "الرقم مطلوب",
      "any.required": "الرقم مطلوب",
    }),
    gender: joi.string().valid("ذكر", "أنثى").required().messages({
      "any.only": "يحب أن يكون ذكر أو أنثى",
      "any.required": "نوع الجنس مطلوب",
    }),
    academicYear: joi
      .string()
      .valid(
        "السنة الأولى",
        "السنة الثانية",
        "السنة الثالثة",
        "السنة الرابعة",
        "السنة الخامسة"
      )
      .required()
      .messages({
        "any.only": "يجب ان يكون من السنة الاولى الى السنة الخامسة",
        "any.required": "السنة الدراسية مطلوبة",
      }),
    universityNumber: joi.number().required().messages({
      "string.empty": "الرقم الجامعي مطلوب",
      "any.required": "الرقم الجامعي مطلوب",
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
    password: joi.string().min(8).required().messages({
      "string.min": "كلمة السر يجب أن تكون على الأقل 8 أحرف",
      "string.empty": "كلمة السر مطلوبة",
      "any.required": "كلمة السر مطلوبة",
    }),
    fcmToken: joi.string().default(null),
    device_id: joi.string().required().messages({
      "string.empty": "device_Id is required",
      "any.required": "device_Id is required",
    }),
  });

  return schema.validate(obj);
};

// Validation Login Student
const validateLoginStudent = (obj: IStudent): joi.ValidationResult => {
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
    device_id: joi.string().required().messages({
      "string.empty": "device_Id is required",
      "any.required": "device_Id is required",
    }),
  });

  return schema.validate(obj);
};

// Validation Send Eamil
const validateSendEmail = (obj: IStudent): joi.ValidationResult => {
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

// Validation Reset Pass
const validateResetPass = (obj: IStudent): joi.ValidationResult => {
  const schema = joi.object({
    otp: joi.string().length(5).required().messages({
      "string.empty": "لا يمكن أن يكون فارغاً",
      "any.required": "مطلوب",
    }),
  });

  return schema.validate(obj);
};

// Validation Password
const validatePasswourd = (obj: IStudent): joi.ValidationResult => {
  const schema = joi.object({
    password: joi.string().min(8).required().messages({
      "string.min": "كلمة السر يجب أن تكون على الأقل 8 أحرف",
      "string.empty": "كلمة السر مطلوبة",
      "any.required": "كلمة السر مطلوبة",
    }),
  });

  return schema.validate(obj);
};

// Validation Update Student
const validateUpdateStudent = (
  obj: Partial<IStudent>
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
    phoneNumber: joi.string().messages({
      "string.empty": "الرقم مطلوب",
    }),
    academicYear: joi
      .string()
      .valid(
        "السنة الأولى",
        "السنة الثانية",
        "السنة الثالثة",
        "السنة الرابعة",
        "السنة الخامسة"
      )
      .messages({
        "any.only": "يجب ان يكون من السنة الاولى الى السنة الخامسة",
      }),
  });

  return schema.validate(obj);
};

// Validation Update Important Student
const validateUpdateImportantStudent = (
  obj: Partial<IStudent>
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
    phoneNumber: joi.string().messages({
      "string.empty": "الرقم مطلوب",
    }),
    academicYear: joi
      .string()
      .valid(
        "السنة الأولى",
        "السنة الثانية",
        "السنة الثالثة",
        "السنة الرابعة",
        "السنة الخامسة"
      )
      .messages({
        "any.only": "يجب ان يكون من السنة الاولى الى السنة الخامسة",
      }),
    universityNumber: joi.number().messages({
      "string.empty": "الرقم الجامعي مطلوب",
      "any.required": "الرقم الجامعي مطلوب",
    }),
    birth: joi.date().messages({
      "date.base": "تاريخ الميلاد غير صالح",
      "any.required": "تاريخ الميلاد مطلوب",
    }),
    email: joi.string().email().min(3).max(100).messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
      "string.min": "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف",
      "string.max": "البريد الإلكتروني يجب ألا يتجاوز 100 حرف",
      "any.required": "البريد الإلكتروني مطلوب",
    }),
    device_id: joi.string().messages({
      "string.empty": "device_Id is required",
    }),
  });

  return schema.validate(obj);
};

const validateUpdateSuspendedStudent = (
  obj: Partial<IStudent>
): joi.ValidationResult => {
  const schema = joi.object({
    suspended: joi.boolean().required().messages({
      "any.required": "عملية التقييد مطلوب",
    }),
    suspensionReason: joi.string().required().messages({
      "any.required": "سبب التقييد مطلوب",
    }),
  });

  return schema.validate(obj);
};

const validateUpdateFcmToken = (
  obj: Partial<IStudent>
): joi.ValidationResult => {
  const schema = joi.object({
    fcmToken: joi.string().allow(null, "").optional().messages({
      "string.base": "FCM Token يجب أن يكون نصًا",
    }),
  });
  return schema.validate(obj);
};

const validateUpdateDeviceIdReset = (
  obj: Partial<IStudent>
): joi.ValidationResult => {
  const schema = joi.object({
    device_id_reset: joi.boolean().required().messages({
      "boolean.base": "device_id_reset يجب أن يكون قيمة منطقية",
      "any.required": "device_id_reset مطلوب",
    }),
  });
  return schema.validate(obj);
};

export {
  Student,
  validationOtp,
  validateCreateStudent,
  validateUpdateStudent,
  validateLoginStudent,
  validateSendEmail,
  validateResetPass,
  validatePasswourd,
  validateUpdateSuspendedStudent,
  validateUpdateImportantStudent,
  validateUpdateFcmToken,
  validateUpdateDeviceIdReset,
};
