import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

const nullableText = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string") return v.trim(); // يسمح ""
  return v;
}, z.string().nullable().optional());

const nullableNumber = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (v === "") return null; // form-data ممكن يرسل "" بدل null
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}, z.number().min(0, "علامة الفروب لا يمكن أن تكون أقل من 0").nullable().optional());

export const createGroupSchema = z.object({
  examId: objectId,
  mainTitle: nullableText,
  totalMark: nullableNumber,
});

export const updateGroupSchema = z.object({
  examId: objectId.optional(),
  mainTitle: nullableText,
  totalMark: nullableNumber,
});

// ===== Types =====
export type createGroupInput = z.infer<typeof createGroupSchema>;
export type updateGroupInput = z.infer<typeof updateGroupSchema>;
