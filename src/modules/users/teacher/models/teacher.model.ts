import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcrypt";
import { ITeacher } from "../types/teacher.types";
import { env } from "../../../../bootstrap/env";

// Teacher Schema
const TeacherSchema = new Schema<ITeacher>(
  {
    profilePhoto: {
      type: String,
      default:
        "https://i.postimg.cc/JzCB3CDX/Profile-Picture-Container-(2).png",
      required: true,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) => /^09[0-9]{8}$/.test(v),
        message: "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.",
      },
      index: true,
    },

    gender: { type: String, enum: ["ذكر", "انثى"], required: true },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    password: { type: String, required: true, select: false },

    otp: { type: String, select: false, default: "" },
    about: { type: String, trim: true, default: "" },

    available: { type: Boolean, default: true },
    suspended: { type: Boolean, default: false },

    resetPass: { type: Boolean, default: false },
    suspensionReason: { type: String, default: "" },
    suspensionEnd: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password
TeacherSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const saltRounds = env.BCRYPT_SALT_ROUNDS ?? 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Remove Password And OTP In Json
TeacherSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const r = ret as { password?: string; otp?: string };
    r.password = undefined;
    r.otp = undefined;
    return r;
  },
});

// Indexes
TeacherSchema.index({ createdAt: -1 });

// Teacher Model
export const Teacher: Model<ITeacher> = mongoose.model<ITeacher>(
  "Teacher",
  TeacherSchema
);
