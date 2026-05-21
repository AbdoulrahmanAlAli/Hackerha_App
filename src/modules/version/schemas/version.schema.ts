import { z } from "zod";

// ===== Create Version =====
export const createVersionSchema = z.object({
  version: z.string().min(1, "رقم الإصدار مطلوب"),

  url: z.string().min(1, "رابط التحميل مطلوب"),

  isBankActive: z.boolean()
}).strict();

// ===== Update Version =====
export const updateVersionSchema = z.object({
  version: z.string().min(1, "رقم الإصدار مطلوب").optional(),

  url: z.string().min(1, "رابط التحميل مطلوب").optional(),

  isBankActive: z.boolean().optional()
}).strict();
