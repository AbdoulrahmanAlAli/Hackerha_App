import { z } from "zod";

// Create Social Schema
export const createSocialSchema = z.object({
  title: z
    .string()
    .min(1, "عنوان المنصة الاجتماعية مطلوب")
    .max(100, "العنوان يجب ألا يتجاوز 100 حرف"),

  link: z
    .string()
    .min(1, "رابط المنصة الاجتماعية مطلوب")
    .url("الرابط غير صالح"),
});

// Update Social Schema
export const updateSocialSchema = z.object({
  title: z
    .string()
    .min(1, "عنوان المنصة الاجتماعية مطلوب")
    .max(100, "العنوان يجب ألا يتجاوز 100 حرف")
    .optional(),

  link: z
    .string()
    .min(1, "رابط المنصة الاجتماعية مطلوب")
    .url("الرابط غير صالح")
    .optional(),
});

// Export types from schemas
export type CreateSocialInput = z.infer<typeof createSocialSchema>;
export type UpdateSocialInput = z.infer<typeof updateSocialSchema>;
