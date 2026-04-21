import { z } from "zod";

const phoneRegex = /^09[0-9]{8}$/;

export const academicYears = [
  "السنة الأولى",
  "السنة الثانية",
  "السنة الثالثة",
  "السنة الرابعة",
  "السنة الخامسة",
] as const;

export const semesters = ["الفصل الأول", "الفصل الثاني"] as const;

export const createTeacherSchema = z.object({
  fullName: z.string().min(1, "الاسم مطلوب").max(100, "الاسم يجب ألا يتجاوز 100 حرف"),
  phoneNumber: z.string().regex(phoneRegex, "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام."),
  gender: z.enum(["ذكر", "أنثى"], { message: "يحب أن يكون ذكر أو أنثى" }),
  email: z.string().email("البريد الإلكتروني غير صالح").min(3).max(100),
  about: z.string().trim().optional().default(""),
  password: z.string().min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف"),
});

export const loginTeacherSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح").min(3).max(100),
  password: z.string().min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف"),
});

export const updateTeacherSchema = z.object({
  fullName: z.string().max(100).optional(),
  phoneNumber: z.string().regex(phoneRegex, "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.").optional(),
  profilePhoto: z.string().url("يجب أن يكون رابط الصورة صحيحاً").optional(),
  about: z.string().trim().optional(),
});

export const updateTeacherImportantSchema = z.object({
  fullName: z.string().max(100).optional(),
  phoneNumber: z.string().regex(phoneRegex, "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام.").optional(),
  gender: z.enum(["ذكر", "أنثى"]).optional(),
  email: z.string().email("البريد الإلكتروني غير صالح").min(3).max(100).optional(),
    about: z.string().trim().optional(),

});

export const updateTeacherSuspendedSchema = z.object({
  suspended: z.boolean({ message: "عملية التقييد مطلوبة" }),
  suspensionReason: z.string().min(1, "سبب التقييد مطلوب"),
  suspensionEnd: z.coerce.date({ message: "تاريخ انتهاء التقييد غير صالح" }),
});

export const sendEmailSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح").min(3).max(100),
});

export const otpSchema = z.object({
  otp: z.string().length(5, "OTP يجب أن يكون 5 خانات"),
});

export const passwordSchema = z.object({
  password: z.string().min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف"),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type LoginTeacherInput = z.infer<typeof loginTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
