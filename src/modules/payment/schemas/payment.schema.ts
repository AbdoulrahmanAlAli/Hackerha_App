import { z } from "zod";

// ===== Helpers =====
export const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

// ===== Create Payment =====
export const createPaymentSchema = z.object({
  code: z.string().min(4, "كود الدفع قصير جداً").max(20, "كود الدفع طويل جداً"),

  universityNumber: z.number().int("يجب أن يكون رقم صحيح"),

  courseId: objectId,

  studentId: objectId.optional(),

  price: z.number().min(0, "السعر لا يمكن أن يكون سالبًا"),

  adminName: z.string().min(1, "اسم المسؤول مطلوب"),

  studentNumber: z.string().min(1, "رقم الطالب مطلوب"),

  expiresAt: z.coerce.date().refine((d) => !isNaN(d.getTime()), {
    message: "تاريخ الانتهاء غير صالح",
  }),
});

// ===== Create Payment Code =====

export const generatePaymentCodeSchema = z.object({
  universityNumber: z.number().int("يجب أن يكون رقم صحيح"),

  courseId: objectId,

  price: z.number().min(0, "السعر لا يمكن أن يكون سالبًا"),
});

// ===== Update Payment =a====
export const updatePaymentSchema = z.object({
  studentId: objectId.optional(),
  used: z.boolean().optional(),
  expiresAt: z.coerce.date().optional(),
});
