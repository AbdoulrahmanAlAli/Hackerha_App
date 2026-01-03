import { z } from "zod";

export const createVideoTokenSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح"),
  videoUrl: z.string().min(1, "رابط الفيديو مطلوب"),
  // اختياري: لو أردت ربطه بمستخدم
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح").optional(),
});

export const playVideoSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/i, "Token غير صالح"),
});

export type CreateVideoTokenInput = z.infer<typeof createVideoTokenSchema>;
