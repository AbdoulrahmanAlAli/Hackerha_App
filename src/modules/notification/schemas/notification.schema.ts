import { z } from "zod";

// ===== constants =====
export const notificationTypes = [
  "alert",
  "new",
  "success",
  "discount",
  "connection",
] as const;

// ===== Helpers =====
export const objectId = z
  .string()
  .min(1, "مطلوب")
  .regex(/^[0-9a-fA-F]{24}$/, "معرف غير صالح");

// ===== Create Notification =====
export const createNotificationSchema = z.object({
  studentId: objectId.nullable().optional(),

  type: z.enum(notificationTypes, {
    message: "نوع الإشعار غير صالح",
  }),

  title: z
    .string()
    .min(1, "عنوان الإشعار مطلوب")
    .max(200, "العنوان يجب ألا يتجاوز 200 حرف"),

  subtitle: z
    .string()
    .min(1, "النص الفرعي للإشعار مطلوب")
    .max(500, "النص الفرعي يجب ألا يتجاوز 500 حرف"),
});

// ===== Update Notification =====
export const updateNotificationSchema = z.object({
  studentId: objectId.nullable().optional(),

  type: z
    .enum(notificationTypes, {
      message: "نوع الإشعار غير صالح",
    })
    .optional(),

  title: z
    .string()
    .min(1, "عنوان الإشعار مطلوب")
    .max(200, "العنوان يجب ألا يتجاوز 200 حرف")
    .optional(),

  subtitle: z
    .string()
    .min(1, "النص الفرعي للإشعار مطلوب")
    .max(500, "النص الفرعي يجب ألا يتجاوز 500 حرف")
    .optional(),
});
