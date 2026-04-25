import { z } from "zod";

const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

export const answerSchema = z.object({
  title: z.string().min(1, "عنوان الإجابة مطلوب"),
  correct: z.boolean(),
});

const directionSchema = z.enum(["ltr", "rtl"], {
  message: "الاتجاه يجب أن يكون إما ltr أو rtl",
});

const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return v;
};

const examNumber = z.preprocess(
    toNumber,
    z
      .number({ error: "رقم الامتحان مطلوب" })
      .int("رقم الامتحان يجب أن يكون رقمًا صحيحًا")
      .min(1, "رقم الامتحان يجب أن يكون 1 أو أكثر")
);
  
// create
export const createSingleQuestionSchemaBank = z.object({
  bankId: objectId,
  number: examNumber.optional(),
  title: z.string().optional().default(""),
  subTitle: z.string().optional().default(""),
  image: z.string().optional().default(""),
  answers: z
    .array(answerSchema)
    .min(1, "يجب أن يحتوي السؤال على الأقل على إجابة واحدة"),
  mark: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? v : Number(v)),
    z.number({ message: "علامة السؤال يجب أن تكون رقماً" })
  ),
  note: z.string().optional().default(""),
  direction: directionSchema.optional().default("rtl"),
});

// update
export const updateSingleQuestionSchemaBank = z.object({
  bankId: objectId.optional(),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  image: z.string().optional(),
  answers: z
    .array(answerSchema)
    .min(1, "يجب أن يحتوي السؤال على الأقل على إجابة واحدة")
    .optional(),
  mark: z
    .preprocess(
      (v) => (v === "" || v === undefined || v === null ? v : Number(v)),
      z.number()
    )
    .optional(),
  note: z.string().optional(),
  direction: directionSchema.optional(),
});

export const zodAnswersArraySchema = z
  .array(answerSchema)
  .min(1, "يجب أن يحتوي السؤال على الأقل على إجابة واحدة");
