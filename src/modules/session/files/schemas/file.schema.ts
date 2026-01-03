import { z } from "zod";

const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

export const createFileSchema = z.object({
  url: z.string(),
  
  name: z
    .string()
    .min(1, "اسم الملف مطلوب")
    .max(100, "اسم الملف يجب ألا يتجاوز 100 حرف"),

  courseId: objectId,
  sessionId: objectId,

  description: z
    .string()
    .max(500, "الوصف يجب ألا يتجاوز 500 حرف")
    .optional(),
});

// تحديث: فقط اسم/وصف (ولا نسمح بتعديل courseId/sessionId عادة)
export const updateFileSchema = z.object({
  name: z
    .string()
    .min(1, "اسم الملف مطلوب")
    .max(100, "اسم الملف يجب ألا يتجاوز 100 حرف")
    .optional(),

  description: z
    .string()
    .max(500, "الوصف يجب ألا يتجاوز 500 حرف")
    .optional(),
});
