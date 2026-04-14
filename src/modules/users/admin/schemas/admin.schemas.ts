import { z } from "zod";

const phoneRegex = /^09[0-9]{8}$/;
const adminRoles = ["admin", "dataEntry", "superAdmin"] as const;

export const createAdminSchema = z.object({
  fullName: z
    .string()
    .min(1, "الاسم مطلوب")
    .max(100, "الاسم يجب ألا يتجاوز 100 حرف"),

  phoneNumber: z
    .string()
    .min(1, "رقم الهاتف مطلوب")
    .regex(
      phoneRegex,
      "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام."
    ),

  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),

  password: z
    .string()
    .min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف")
    .min(1, "كلمة السر مطلوبة"),

   role: z
    .enum(adminRoles, {
      message: "الدور غير صالح: يجب أن يكون مدير، مشرف متميز، أو مدخل بيانات",
    })
    .default("dataEntry"),
});

export const updateAdminSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "الاسم مطلوب")
      .max(100, "الاسم يجب ألا يتجاوز 100 حرف")
      .optional(),
    phoneNumber: z
      .string()
      .regex(
        phoneRegex,
        "رقم الهاتف غير صالح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام."
      )
      .optional(),
    email: z.string().email("البريد الإلكتروني غير صالح").optional(),
    password: z
      .string()
      .min(8, "كلمة السر يجب أن تكون على الأقل 8 أحرف")
      .optional(),
    role: z
      .enum(adminRoles, {
        message: "الدور غير صالح: يجب أن يكون مدير، مشرف متميز، أو مدخل بيانات",
      })
      .optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "لا توجد بيانات للتحديث",
  });

export const loginAdminSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),

  password: z.string().min(1, "كلمة السر مطلوبة"),
});

// (اختياري) Types جاهزة للاستخدام في controller/service
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type LoginAdminInput = z.infer<typeof loginAdminSchema>;
