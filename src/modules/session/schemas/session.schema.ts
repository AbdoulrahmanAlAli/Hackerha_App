import { z } from "zod";

// ===== Helpers =====
const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return v;
};

const sessionNumber = z.preprocess(
  toNumber,
  z
    .number({ error: "رقم الجلسة مطلوب" })
    .int("رقم الجلسة يجب أن يكون رقمًا صحيحًا")
    .min(1, "رقم الجلسة يجب أن يكون 1 أو أكثر")
);

const nonEmptyString = (msg: string) =>
  z.string().min(1, msg);

// ===== Create Session =====
export const createSessionSchema = z.object({
  number: sessionNumber.optional(),
  courseId: objectId, // كان string في joi، لكن الأفضل يتحقق أنه ObjectId
  video: nonEmptyString("رابط الفيديو مطلوب"),
  name: nonEmptyString("اسم الجلسة مطلوب").max(100, "الاسم يجب ألا يتجاوز 100 حرف"),
  note: z.string().max(500, "الملاحظات يجب ألا تتجاوز 500 حرف").optional(),
  duration: nonEmptyString("مدة الفيديو مطلوبة"),
});

// ===== Update Session =====
// Joi القديم: كل شيء optional + available boolean
export const updateSessionSchema = z.object({
  number: sessionNumber.optional(),
  courseId: objectId.optional(),
  video: z.string().min(1, "رابط الفيديو مطلوب").optional(),
  name: z.string().min(1, "اسم الجلسة مطلوب").max(100, "الاسم يجب ألا يتجاوز 100 حرف").optional(),
  note: z.string().max(500, "الملاحظات يجب ألا تتجاوز 500 حرف").optional(),
  duration: z.string().min(1, "مدة الفيديو مطلوبة").optional(),
  available: z.boolean().optional(),
});

// ===== Types =====
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
