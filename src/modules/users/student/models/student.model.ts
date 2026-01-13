import mongoose, { Schema, type Model } from "mongoose";
import bcrypt from "bcrypt";
import { env } from "../../../../bootstrap/env";
import { IStudent, StudentDocument } from "../types/student.types";

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
      minlength: [3, "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف"],
      maxlength: [100, "البريد الإلكتروني يجب ألا يتجاوز 100 حرف"],
      lowercase: true,
      // لو عندك داتا قديمة قد تكون فيها تكرارات، احذف unique
      unique: true,
    },
    password: {
      type: String,
      required: [true, "كلمة السر مطلوبة"],
      trim: true,
      minlength: [8, "كلمة السر يجب أن يكون على الأقل 8 أحرف"],
      select: false,
    },
    otp: {
      type: String,
      length: 5,
    },
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
    suspensionReason: { type: String, default: "" },
    suspensionEnd: { type: Date },

    favoriteCourses: [
      { type: Schema.Types.ObjectId, ref: "Course", default: [] },
    ],
    favoriteSessions: [
      { type: Schema.Types.ObjectId, ref: "Session", default: [] },
    ],
    favoriteBank: [{ type: Schema.Types.ObjectId, ref: "Bank", default: [] }],
    enrolledCourses: [
      { type: Schema.Types.ObjectId, ref: "Course", default: [] },
    ],

    banks: [{ type: Schema.Types.ObjectId, ref: "Bank", default: [] }],
    contents: [{ type: Schema.Types.ObjectId, ref: "Content", default: [] }],
    courses: [{ type: Schema.Types.ObjectId, ref: "Course", default: [] }],
    sessions: [{ type: Schema.Types.ObjectId, ref: "Session", default: [] }],
    exams: [{ type: Schema.Types.ObjectId, ref: "Session", default: [] }],
  },
  { timestamps: true }
);

// Hash password
StudentSchema.pre("save", async function () {
  const student = this as StudentDocument;
  if (!student.isModified("password")) return;

  const saltRounds = env.BCRYPT_SALT_ROUNDS ?? 10;
  student.password = await bcrypt.hash(student.password, saltRounds);
});

// Remove Password And OTP In Json
StudentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const r = ret as { password?: string; otp?: string };
    r.password = undefined;
    r.otp = undefined;
    return r;
  },
});

// Indexes
StudentSchema.index({ createdAt: -1 });
StudentSchema.index({ banks: 1 });
StudentSchema.index({ contents: 1 });
StudentSchema.index({ email: 1, available: 1 });
StudentSchema.index({ phoneNumber: 1, available: 1 });
StudentSchema.index({ universityNumber: 1, available: 1 });

// Student Model
export const Student: Model<IStudent> = mongoose.model<IStudent>(
  "Student",
  StudentSchema
);
