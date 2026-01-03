import mongoose, { Schema, type Model } from "mongoose";
import bcrypt from "bcrypt";
import { env } from "../../../../bootstrap/env";
import type { IAdmin, AdminDocument } from "../types/admin.types";

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
  },
  { timestamps: true }
);

AdminSchema.pre("save", async function () {
  const admin = this as AdminDocument;

  if (!admin.isModified("password")) return;

  const saltRounds = env.BCRYPT_SALT_ROUNDS ?? 10;
  admin.password = await bcrypt.hash(admin.password, saltRounds);
});

AdminSchema.set("toJSON", {
  transform: (_doc, ret) => {
    (ret as { password?: string }).password = undefined;
    return ret;
  },
});

AdminSchema.index({ createdAt: -1 });

export const Admin: Model<IAdmin> = mongoose.model<IAdmin>(
  "Admin",
  AdminSchema
);
