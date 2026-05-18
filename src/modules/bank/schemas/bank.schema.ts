import { z } from "zod";

// تحويل القيمة إلى رقم إذا كانت string
const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return v;
};

// Enum للسنة
const yearEnum = z.enum([
  "السنة الأولى",
  "السنة الثانية",
  "السنة الثالثة",
  "السنة الرابعة",
  "السنة الخامسة",
]);

// Enum للفصل
const semesterEnum = z.enum(["الفصل الأول", "الفصل الثاني"]);

// Schema إنشاء بنك جديد
export const createBankSchema = z.object({
  title: z
    .string()
    .min(1, "عنوان البنك مطلوب")
    .max(100, "العنوان يجب ألا يتجاوز 100 حرف"),

  year: yearEnum,

  semester: semesterEnum,
});

// Schema تحديث بنك
export const updateBankSchema = z.object({
  title: z
    .string()
    .min(1, "عنوان البنك مطلوب")
    .max(100, "العنوان يجب ألا يتجاوز 100 حرف")
    .optional(),

  year: yearEnum.optional(),

  semester: semesterEnum.optional(),

  available: z.boolean().optional(),
});

// Types مستنتجة من Zod
export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;