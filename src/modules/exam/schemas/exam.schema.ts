import { z } from "zod";

export const durationRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return v;
};

const numRequired = (msg: string) =>
  z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number({ message: msg })
  );

const examNumber = z.preprocess(
    toNumber,
    z
      .number({ error: "رقم الامتحان مطلوب" })
      .int("رقم الامتحان يجب أن يكون رقمًا صحيحًا")
      .min(1, "رقم الامتحان يجب أن يكون 1 أو أكثر")
);
  
export const createExamSchema = z.object({
  number: examNumber.optional(),
  courseId: objectId,
  title: z
    .string()
    .min(1, "عنوان الامتحان مطلوب")
    .max(100, "العنوان يجب ألا يتجاوز 100 حرف"),

  totalMark: numRequired("العلامة الإجمالية مطلوبة"),

  duration: z
    .string()
    .min(1, "المدة مطلوبة")
    .regex(durationRegex, "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00"),
});

export const updateExamSchema = z.object({
  number: z.preprocess(toNumber, z.number().int().min(1)).optional(),
  courseId: objectId.optional(),
  title: z.string().min(1).max(100).optional(),
  totalMark: z.preprocess(toNumber, z.number().min(0)).optional(),
  duration: z
    .string()
    .regex(durationRegex, "المدة يجب أن تكون بالتنسيق 00:00 أو 00:00:00")
    .optional(),

  available: z.boolean().optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
