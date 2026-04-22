import { z } from "zod";

// ===== Helpers =====
export const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

// ===== Create Invoice =====
export const createTeacherInvoiceSchema = z.object({
  teacherId: objectId,
  priceTaken: z.number().min(0, "المبلغ المأخوذ لا يمكن أن يكون سالباً"),
  notes: z.string().optional(),
});

// ===== Update Invoice =====
export const updateTeacherInvoiceSchema = z.object({
  priceTaken: z.number().min(0, "المبلغ المأخوذ لا يمكن أن يكون سالباً").optional(),
  total: z.number().min(0, "الإجمالي لا يمكن أن يكون سالباً").optional(),
  notes: z.string().optional(),
});