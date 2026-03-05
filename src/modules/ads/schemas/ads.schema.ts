import { z } from "zod";

// Create Ads Schema
export const createAdsSchema = z.object({
  image: z.string().min(1, "صورة الإعلان مطلوبة"),
});

// Update Ads Schema
export const updateAdsSchema = z.object({
  image: z.string().min(1, "صورة الإعلان مطلوبة").optional(),
});

// Export types from schemas
export type CreateAdsInput = z.infer<typeof createAdsSchema>;
export type UpdateAdsInput = z.infer<typeof updateAdsSchema>;
