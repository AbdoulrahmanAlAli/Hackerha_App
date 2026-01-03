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

// create
export const createQuestionSchema = z.object({
  groupId: objectId,
  title: z.string().optional().default(""),
  subTitle: z.string().optional().default(""),
  image: z.string().url("يجب أن يكون رابط الصورة صحيحًا").optional(),
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
export const updateQuestionSchema = z.object({
  groupId: objectId.optional(),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  image: z.string().url("يجب أن يكون رابط الصورة صحيحًا").optional(),
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
