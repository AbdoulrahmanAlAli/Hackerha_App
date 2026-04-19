import { z } from "zod";

// Regex للتحقق من صيغة الوقت:
// يقبل 00:00 أو 00:00:00
export const durationRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

// تحويل القيمة إلى رقم إذا كانت string
const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return v;
};

// حقل رقمي مطلوب
const numRequired = (msg: string) =>
  z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number({ message: msg })
  );

const pdfUrlSchema = z
  .string()
  .min(1, "ملف PDF مطلوب")
  .url("رابط الملف غير صالح")

// Schema إنشاء بنك جديد
export const createBankSchema = z.object({
  title: z
    .string()
    .min(1, "عنوان البنك مطلوب")
    .max(100, "العنوان يجب ألا يتجاوز 100 حرف"),

  totalMark: numRequired("العلامة الإجمالية مطلوبة"),

  duration: z
    .string()
    .min(1, "المدة مطلوبة")
    .regex(durationRegex, "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00"),
  pdfUrl: pdfUrlSchema
});

// Schema تحديث بنك
export const updateBankSchema = z.object({
  title: z
    .string()
    .min(1, "عنوان البنك مطلوب")
    .max(100, "العنوان يجب ألا يتجاوز 100 حرف")
    .optional(),

  totalMark: z
    .preprocess(toNumber, z.number().min(0, "العلامة لا يمكن أن تكون سالبة"))
    .optional(),

  duration: z
    .string()
    .regex(durationRegex, "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00")
    .optional(),
  pdfUrl: z.string().url().optional(),
  available: z.boolean().optional(),
});

// Types مستنتجة من Zod
export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;