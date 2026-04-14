import mongoose, { Schema, type Model } from "mongoose";
import bcrypt from "bcrypt";
import { env } from "../../../../bootstrap/env";
import type { IAdmin, AdminDocument } from "../types/admin.types";

// Admin Schema
const AdminSchema = new Schema<IAdmin>(
  {
    fullName: {
      type: String,
      required: [true, "الاسم مطلوب"],
      trim: true,
      maxlength: [100, "الاسم يجب ألا يتجاوز 100 حرف"],
    },
    phoneNumber: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      trim: true,
      validate: {
        validator: (v: string) => /^09[0-9]{8}$/.test(v),
        message: (props: any) =>
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
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "superAdmin", "dataEntry"],
        message: "الدور غير صالح: يجب أن يكون مدير، مشرف متميز، أو مدخل بيانات",
      },
      default: "dataEntry",
      required: true,
    },
  },
  { timestamps: true }
);

// Hash password
AdminSchema.pre("save", async function () {
  const admin = this as AdminDocument;

  if (!admin.isModified("password")) return;

  const saltRounds = env.BCRYPT_SALT_ROUNDS ?? 10;
  admin.password = await bcrypt.hash(admin.password, saltRounds);
});

// Remove Password In Json
AdminSchema.set("toJSON", {
  transform: (_doc, ret) => {
    (ret as { password?: string }).password = undefined;
    return ret;
  },
});

// Indexes
AdminSchema.index({ createdAt: -1 });

// Admin Model
export const Admin: Model<IAdmin> = mongoose.model<IAdmin>(
  "Admin",
  AdminSchema
);
