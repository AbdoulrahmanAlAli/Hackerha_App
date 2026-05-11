import mongoose, { Schema, Model, Types } from "mongoose";
import bcrypt from "bcrypt";
import { PaymentDocument } from "../types/payment.types";

// Schema
const PaymentSchema = new Schema<PaymentDocument>(
  {
    code: {
      type: String,
      required: [true, "كود الدفع مطلوب"],
      unique: true,
      trim: true,
    },

    universityNumber: {
      type: Number,
      required: [true, "الرقم الجامعي مطلوب"],
    },

    price: {
      type: Number,
      required: [true, "سعر الكورس مطلوب"],
      min: [0, "السعر لا يمكن أن يكون سالبًا"],
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "معرف الكورس مطلوب"],
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    adminName: {
      type: String,
      trim: true,
    },

    studentNumber: {
      type: String,
      trim: true,
    },

    used: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: [true, "تاريخ الانتهاء مطلوب"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ universityNumber: 1 });
PaymentSchema.index({ courseId: 1 });
PaymentSchema.index({ adminName: 1 });

// Hash code before save
PaymentSchema.pre("save", async function () {
  if (!this.isModified("code")) return;

  const salt = await bcrypt.genSalt(10);
  this.code = await bcrypt.hash(this.code, salt);
});

// Compare method
PaymentSchema.methods.compareCode = async function (
  candidateCode: string,
): Promise<boolean> {
  return bcrypt.compare(candidateCode, this.code);
};

// Model
export const Payment: Model<PaymentDocument> = mongoose.model<PaymentDocument>(
  "Payment",
  PaymentSchema,
);
