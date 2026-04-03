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

export const University_branch = ["دمشق", "حلب"] as const;

// ===== Helpers =====
export const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

export const objectIdArray = z.preprocess((v) => {
  if (Array.isArray(v)) return v;

  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [v];
    }
  }

  return v;
}, z.array(objectId).min(1, "يجب اختيار أستاذ واحد على الأقل")); 

// ===== discount (Create) =====
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

// ===== discount (Update) =====
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

    price: z.number().min(0, "السعر لا يمكن أن يكون سالبًا"),

    teachers: objectIdArray,

    universityBranch: z.enum(University_branch, {
      message: "يجب أن يكون حلب أو دمشق",
    }),

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

    universityBranch: z
      .enum(University_branch, { message: "يجب أن يكون حلب أو دمشق" })
      .optional(),

    year: z
      .enum(academicYears, {
        message: "يجب ان يكون من السنة الاولى الى السنة الخامسة",
      })
      .optional(),

    semester: z
      .enum(semesters, {
        message: "يجب ان يكون الفصل الأول او الفصل الثاني",
      })
      .optional(),

    type: z
      .enum(courseTypes, {
        message: "يجب ان يكون نظري او عملي أو شاملة",
      })
      .optional(),

    teachers: objectIdArray.optional(),

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
    if (v.free === false && v.price === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "لا يمكن أن يكون الكورس مدفوعاً وسعره صفر",
        path: ["price"],
      });
    }

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