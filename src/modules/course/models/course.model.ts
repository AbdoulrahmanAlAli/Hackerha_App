import mongoose, { Schema, Model } from "mongoose";
import { ICourse } from "../types/course.types";

const CourseDiscountSchema = new Schema(
  {
    dis: {
      type: Boolean,
      required: true,
      default: false,
    },
    rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    image: {
      type: String,
      required: [true, "صورة الكورس مطلوبة"],
      trim: true,
    },

    name: {
      type: String,
      required: [true, "اسم الكورس مطلوب"],
      trim: true,
      maxlength: [100, "الاسم يجب ألا يتجاوز 100 حرف"],
    },

    teachers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Teacher",
          required: true,
        },
      ],
      required: [true, "يجب اختيار أستاذ واحد على الأقل"],
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) =>
          Array.isArray(v) && v.length > 0,
        message: "يجب اختيار أستاذ واحد على الأقل",
      },
    },

    universityBranch: {
      type: String,
      enum: ["دمشق", "حلب"],
      required: [true, "الفرع الجامعي مطلوب"],
    },

    description: {
      type: String,
      required: [true, "وصف الكورس مطلوب"],
      trim: true,
      maxlength: [500, "الوصف يجب ألا يتجاوز 500 حرف"],
    },

    price: {
      type: Number,
      required: [true, "السعر مطلوب"],
      min: [0, "السعر لا يمكن أن يكون سالبًا"],
      default: 0,
    },

    note: {
      type: String,
      trim: true,
      maxlength: [200, "الملاحظات يجب ألا تتجاوز 200 حرف"],
      default: "",
    },

    whatsapp: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      enum: ["نظري", "عملي", "شاملة"],
      required: [true, "نوع الكورس مطلوب"],
    },

    discount: {
      type: CourseDiscountSchema,
      required: true,
      default: {
        dis: false,
        rate: 0,
      },
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
      required: [true, "السنة مطلوبة"],
    },

    semester: {
      type: String,
      enum: ["الفصل الأول", "الفصل الثاني"],
      required: [true, "الفصل مطلوب"],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    about: {
      type: String,
      required: [true, "معلومات عن الكورس مطلوبة"],
      trim: true,
      maxlength: [1000, "المعلومات يجب ألا تتجاوز 1000 حرف"],
    },

    available: {
      type: Boolean,
      default: true,
    },

    maintenance: {
      type: Boolean,
      default: false,
    },

    video: {
      type: String,
      default: "",
    },

    free: {
      type: Boolean,
      default: false,
    },

    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    fakeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtuals
CourseSchema.virtual("sessions", {
  ref: "Session",
  localField: "_id",
  foreignField: "courseId",
});

CourseSchema.virtual("exams", {
  ref: "Exam",
  localField: "_id",
  foreignField: "courseId",
});

// السعر بعد التخفيض
CourseSchema.virtual("discountedPrice").get(function (this: ICourse) {
  if (this.free) return 0;
  if (!this.discount?.dis) return this.price;

  const rate = this.discount.rate ?? 0;
  return this.price - (this.price * rate) / 100;
});

// indexes
CourseSchema.index({ teachers: 1 });
CourseSchema.index({ year: 1, semester: 1, type: 1 });
CourseSchema.index({ createdAt: -1 });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
