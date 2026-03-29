import mongoose, { Schema, Model, Types } from "mongoose";
import { CourseDocument } from "../types/course.types";
import { Session } from "../../session/models/session.model";

// Course Schema
const CourseSchema = new Schema<CourseDocument>(
  {
    image: { type: String, required: [true, "صورة الكورس مطلوبة"], trim: true },
    name: {
      type: String,
      required: [true, "اسم الكورس مطلوب"],
      trim: true,
      maxlength: [100, "الاسم يجب ألا يتجاوز 100 حرف"],
      unique: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      required: [true, "المعلم مطلوب"],
      ref: "Teacher",
    },
    universityBranch: {
      type: String,
      enum: [
        "حلب",
        "دمشق",
      ],
      required: [true, "الجامعة مطلوبة"],
    },
    description: {
      type: String,
      required: [true, "وصف الكورس مطلوب"],
      trim: true,
      maxlength: [500, "الوصف يجب ألا يتجاوز 500 حرف"],
    },
    price: {
      type: Number,
      required: [true, "سعر الكورس مطلوب"],
      min: [0, "السعر لا يمكن أن يكون سالبًا"],
    },
    year: {
      type: String,
      enum: [
        "السنة الأولى",
        "السنة الثانية",
        "السنة الثالثة",
        "السنة الرابعة",
        "السنة الخامسة",
      ],
      required: [true, "السنة الدراسية مطلوبة"],
    },
    semester: {
      type: String,
      enum: ["الفصل الأول", "الفصل الثاني"],
      required: [true, "الفصل الدراسي مطلوب"],
    },
    note: { type: String, trim: true, maxlength: [200, "الملاحظات يجب ألا تتجاوز 200 حرف"] },
    whatsapp: { type: String, trim: true, default: null },
    type: {
      type: String,
      enum: ["نظري", "عملي", "شاملة"],
      required: [true, "نوع الكورس مطلوب"],
    },
    discount: {
      dis: { type: Boolean, required: true },
      rate: { type: Number, min: 0, max: 100, default: 0 },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    about: {
      type: String,
      required: [true, "معلومات عن الكورس مطلوبة"],
      trim: true,
      maxlength: [1000, "المعلومات يجب ألا تتجاوز 1000 حرف"],
    },
    fakeCount: { type: Number, default: 0 },
    video: { type: String, trim: true },
    free: { type: Boolean, default: false },
    available: { type: Boolean, default: false },
    maintenance: { type: Boolean, default: false },
    students: [{ type: Schema.Types.ObjectId, ref: "Student", default: [] }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// virtual: sessions and exams
//// sessions
CourseSchema.virtual("sessions", {
  ref: "Session",
  localField: "_id",
  foreignField: "courseId",
});

//// exams
CourseSchema.virtual("exams", {
  ref: "Exam",
  localField: "_id",
  foreignField: "courseId",
});
 
//// discountedPrice
CourseSchema.virtual("discountedPrice").get(function (this: CourseDocument) {
  if (this.discount?.dis && this.discount?.rate) {
    return this.price * (1 - this.discount.rate / 100);
  }
  return this.price;
});

// Indexes
CourseSchema.index({ createdAt: -1 });

// Course Model
export const Course: Model<CourseDocument> = mongoose.model<CourseDocument>(
  "Course",
  CourseSchema
);
