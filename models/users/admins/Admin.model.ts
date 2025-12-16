import mongoose, { Schema, Model } from "mongoose";
import joi from "joi";
import { IAdmin } from "./dtos";
import bcrypt from "bcrypt";

// Admin Schema
const AdminSchema = new Schema<IAdmin>(
  {
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
        validator: (v: string) => /^09[0-9]{8}$/.test(v),
        message: (props) =>
          `${props.value} ليس رقم هاتف صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.`,
      },
    },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "البريد الإلكتروني غير صالح",
      },
    },
    password: {
      type: String,
      required: [true, "كلمة السر مطلوبة"],
      trim: true,
      minlength: [8, "كلمة السر يجب أن تكون على الأقل 8 أحرف"],
    },
  },
  {
    timestamps: true,
  }
);

// Password encryption
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Admin Model
const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", AdminSchema);

// Admin Indexes
AdminSchema.index({ createdAt: -1 });

// Validation: Create Admin
const validateCreateAdmin = (obj: IAdmin): joi.ValidationResult => {
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
    email: joi.string().email().required().messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
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

// Validation: Update Admin
const validateUpdateAdmin = (obj: Partial<IAdmin>): joi.ValidationResult => {
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
    email: joi.string().email().messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
    }),
    password: joi.string().min(8).messages({
      "string.min": "كلمة السر يجب أن تكون على الأقل 8 أحرف",
      "string.empty": "كلمة السر مطلوبة",
    }),
  });

  return schema.validate(obj);
};

// Validation: Login Admin
const validateLoginAdmin = (obj: Partial<IAdmin>): joi.ValidationResult => {
  const schema = joi.object({
    email: joi.string().email().required().messages({
      "string.email": "البريد الإلكتروني غير صالح",
      "string.empty": "البريد الإلكتروني مطلوب",
      "any.required": "البريد الإلكتروني مطلوب",
    }),
    password: joi.string().required().messages({
      "string.empty": "كلمة السر مطلوبة",
      "any.required": "كلمة السر مطلوبة",
    }),
  });

  return schema.validate(obj);
};

export { Admin, validateCreateAdmin, validateUpdateAdmin, validateLoginAdmin };
