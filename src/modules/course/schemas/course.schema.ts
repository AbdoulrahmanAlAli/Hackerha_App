import { z } from "zod";

export const courseTypes = ["نظري", "عملي", "شاملة"] as const;

export const academicYears = [
  "السنة الأولى",
  "السنة الثانية",
  "السنة الثالثة",
  "السنة الرابعة",
  "السنة الخامسة",
] as const;

export const semesters = ["الفصل الأول", "الفصل الثاني"] as const;

// ===== Helpers =====
export const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

// discount (Create)
const discountCreateSchema = z
  .object({
    dis: z.boolean(),
    rate: z
      .number()
      .min(0, "نسبة التخفيض لا يمكن أن تكون أقل من 0")
      .max(100, "نسبة التخفيض لا يمكن أن تتجاوز 100")
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.dis === true && v.rate === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "نسبة التخفيض مطلوبة عندما يكون هناك تخفيض",
        path: ["rate"],
      });
    }
  });

// discount (Update)
const discountUpdateSchema = z
  .object({
    dis: z.boolean().optional(),
    rate: z
      .number()
      .min(0, "نسبة التخفيض لا يمكن أن تكون أقل من 0")
      .max(100, "نسبة التخفيض لا يمكن أن تتجاوز 100")
      .optional(),
  })
  .superRefine((v, ctx) => {
    // إذا المستخدم فعّل التخفيض أثناء التحديث لازم يرسل rate
    if (v.dis === true && v.rate === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "نسبة التخفيض مطلوبة عندما يكون هناك تخفيض",
        path: ["rate"],
      });
    }
  });

// ===== Create Course =====
export const createCourseSchema = z
  .object({
    name: z
      .string()
      .min(1, "اسم الكورس مطلوب")
      .max(100, "الاسم يجب ألا يتجاوز 100 حرف"),

    description: z
      .string()
      .min(1, "وصف الكورس مطلوب")
      .max(500, "الوصف يجب ألا يتجاوز 500 حرف"),

    // بعد normalize لازم تكون number فعلي
    price: z.number().min(0, "السعر لا يمكن أن يكون سالبًا"),

    teacher: objectId,

    year: z.enum(academicYears, {
      message: "يجب ان يكون من السنة الاولى الى السنة الخامسة",
    }),

    semester: z.enum(semesters, {
      message: "يجب ان يكون الفصل الأول او الفصل الثاني",
    }),

    type: z.enum(courseTypes, {
      message: "يجب ان يكون نظري او عملي أو شاملة",
    }),

    note: z.string().max(200, "الملاحظات يجب ألا تتجاوز 200 حرف").optional(),
    whatsapp: z.string().optional(),
    about: z
      .string()
      .min(1, "معلومات عن الكورس مطلوبة")
      .max(1000, "المعلومات يجب ألا تتجاوز 1000 حرف"),

    video: z.string().optional(),
    free: z.boolean().optional(),

    discount: discountCreateSchema,
  })
  .superRefine((data, ctx) => {
    // لو free=true السعر لازم يصير 0 (أو نسمح ونصفره بالـ service)
    if (data.free === true && data.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "عند تفعيل الكورس المجاني يجب أن يكون السعر 0",
        path: ["price"],
      });
    }
  });

// ===== Update Course =====
export const updateCourseSchema = z
  .object({
    name: z
      .string()
      .min(1, "اسم الكورس مطلوب")
      .max(100, "الاسم يجب ألا يتجاوز 100 حرف")
      .optional(),

    description: z
      .string()
      .min(1, "وصف الكورس مطلوب")
      .max(500, "الوصف يجب ألا يتجاوز 500 حرف")
      .optional(),

    price: z.number().min(0, "السعر لا يمكن أن يكون سالبًا").optional(),

    note: z.string().max(200, "الملاحظات يجب ألا تتجاوز 200 حرف").optional(),

    whatsapp: z.string().nullable().optional(),

    fakeCount: z.number().optional(),

    year: z
      .enum(academicYears, {
        message: "يجب ان يكون من السنة الاولى الى السنة الخامسة",
      })
      .optional(),

    semester: z
      .enum(semesters, { message: "يجب ان يكون الفصل الأول او الفصل الثاني" })
      .optional(),

    type: z
      .enum(courseTypes, { message: "يجب ان يكون نظري او عملي أو شاملة" })
      .optional(),

    discount: discountUpdateSchema.optional(),

    about: z
      .string()
      .min(1, "معلومات عن الكورس مطلوبة")
      .max(1000, "المعلومات يجب ألا تتجاوز 1000 حرف")
      .optional(),

    video: z.string().optional(),
    free: z.boolean().optional(),
    available: z.boolean().optional(),
    maintenance: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    // إذا صار مدفوع وسعره 0 ممنوع
    if (v.free === false && v.price === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "لا يمكن أن يكون الكورس مدفوعاً وسعره صفر",
        path: ["price"],
      });
    }

    // لو free=true والسعر موجود ولا يساوي 0
    if (v.free === true && v.price !== undefined && v.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "عند تفعيل الكورس المجاني يجب أن يكون السعر 0",
        path: ["price"],
      });
    }
  });

// ===== Get Courses Query =====
export const getCoursesQuerySchema = z.object({
  name: z.string().optional(),

  type: z.enum(courseTypes).optional(),

  hasDiscount: z.preprocess(
    (v) => (v === "true" ? true : v === "false" ? false : v),
    z.boolean().optional()
  ),

  year: z.enum(academicYears).optional(),

  semester: z.enum(semesters).optional(),

  createdLessThanDays: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int("يجب أن يكون رقم صحيح").positive("يجب أن يكون أكبر من 0").optional()
  ),
});
