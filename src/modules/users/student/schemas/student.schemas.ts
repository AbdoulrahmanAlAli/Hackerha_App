import { z } from "zod";

const academicYears = [
  "السنة الأولى",
  "السنة الثانية",
  "السنة الثالثة",
  "السنة الرابعة",
  "السنة الخامسة",
] as const;

const genders = ["ذكر", "انثى"] as const;

const University_branch = ["دمشق", "حلب"] as const

export const otpSchema = z.object({
  otp: z.string().min(1, "لا يمكن أن يكون فارغاً"),
});

export const createStudentSchema = z.object({
  fullName: z
    .string()
    .min(1, "الاسم مطلوب")
    .max(100, "الاسم يجب ألا يتجاوز 100 حرف"),
  phoneNumber: z.string().min(1, "الرقم مطلوب"),

  gender: z.enum(genders, { message: "يحب أن يكون ذكر أو انثى" }),
  academicYear: z.enum(academicYears, {
    message: "يجب ان يكون من السنة الاولى الى السنة الخامسة",
  }),

  universityNumber: z.number({ message: "الرقم الجامعي مطلوب" }),
  universityBranch: z.enum(University_branch, { message: "يجب أن يكون حلب أو دمشق" }),
  email: z
    .string()
    .min(3, "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف")
    .max(100, "البريد الإلكتروني يجب ألا يتجاوز 100 حرف")
    .email("البريد الإلكتروني غير صالح"),

  password: z.string().min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف"),

  // يسمح null مثل القديم
  fcmToken: z.union([z.string(), z.null()]).optional().default(null),

  device_id: z.string().min(1, "device_Id is required"),
});

export const loginStudentSchema = z.object({
  email: z
    .string()
    .min(3, "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف")
    .max(100, "البريد الإلكتروني يجب ألا يتجاوز 100 حرف")
    .email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف"),
  device_id: z.string().min(1, "device_Id is required"),
});

export const sendEmailSchema = z.object({
  email: z
    .string()
    .min(3, "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف")
    .max(100, "البريد الإلكتروني يجب ألا يتجاوز 100 حرف")
    .email("البريد الإلكتروني غير صالح"),
});

export const resetPassSchema = z.object({
  otp: z.string().min(1, "لا يمكن أن يكون فارغاً"),
});

export const passwordSchema = z.object({
  password: z.string().min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف"),
});

// Update Student (في القديم first/last required)
export const updateStudentSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "الاسم مطلوب")
      .max(100, "الاسم يجب ألا يتجاوز 100 حرف")
      .optional(),
    phoneNumber: z.string().min(1, "الرقم مطلوب").optional(),
    academicYear: z
      .enum(academicYears, {
        message: "يجب ان يكون من السنة الاولى الى السنة الخامسة",
      })
      .optional(),
  })
  .strict();

// Update Important Student (في القديم كله optional)
export const updateImportantStudentSchema = z.object({
  fullName: z
    .string()
    .min(1, "الاسم مطلوب")
    .max(100, "الاسم يجب ألا يتجاوز 100 حرف")
    .optional(),

  phoneNumber: z.string().min(1, "الرقم مطلوب").optional(),
  gender: z.enum(genders, { message: "يحب أن يكون ذكر أو انثى" }).optional(),
  academicYear: z
    .enum(academicYears, {
      message: "يجب ان يكون من السنة الاولى الى السنة الخامسة",
    })
    .optional(),
  universityNumber: z.number({ message: "الرقم الجامعي مطلوب" }).optional(),
  universityBranch: z.enum(University_branch, { message: "يجب أن يكون حلب أو دمشق" }).optional(),
  available: z.boolean().optional(),
  resetPass: z.boolean().optional(),
  email: z
    .string()
    .min(3, "البريد الإلكتروني يجب أن يكون على الأقل 3 أحرف")
    .max(100, "البريد الإلكتروني يجب ألا يتجاوز 100 حرف")
    .email("البريد الإلكتروني غير صالح")
    .optional(),
  device_id: z.string().min(1, "device_Id is required").optional(),
  device_id_reset: z.boolean({ message: "device_id_reset مطلوب" }).optional(),
});

export const updateSuspendedStudentSchema = z.object({
  suspended: z.boolean({ message: "عملية التقييد مطلوب" }),
  suspensionReason: z.string().min(1, "سبب التقييد مطلوب"),
});

export const updateFcmTokenSchema = z.object({
  // يسمح null و "" مثل Joi allow(null, "")
  fcmToken: z
    .preprocess(
      (v) => (v === "" ? null : v),
      z.union([z.string(), z.null()]).optional()
    )
    .optional(),
});

export const updateDeviceIdResetSchema = z.object({
  device_id_reset: z.boolean({ message: "device_id_reset مطلوب" }),
});

export const refreshTokenSchema = z.object({
  studentId: z.string().min(1, "معرف الطالب مطلوب"),
  token: z.string().min(1, "التوكن القديم مطلوب"),
});


// Types
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type LoginStudentInput = z.infer<typeof loginStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type UpdateImportantStudentInput = z.infer<
  typeof updateImportantStudentSchema
>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
