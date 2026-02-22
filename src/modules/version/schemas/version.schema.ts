import { z } from "zod";

// ===== Create Version =====
export const createVersionSchema = z.object({
  version: z.string().min(1, "رقم الإصدار مطلوب"),

  url: z.string().min(1, "رابط التحميل مطلوب"),
});

// ===== Update Version =====
export const updateVersionSchema = z.object({
  version: z.string().min(1, "رقم الإصدار مطلوب").optional(),

  url: z.string().min(1, "رابط التحميل مطلوب").optional(),
});
