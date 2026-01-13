import mongoose, { Schema, Model, Types } from "mongoose";
import { NotificationDocument } from "../types/notification.types";


// Notification Schema 
const NotificationSchema = new Schema<NotificationDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    type: {
      type: String,
      enum: ["alert", "new", "success", "discount", "connection"],
      required: [true, "نوع الإشعار مطلوب"],
    },

    title: {
      type: String,
      required: [true, "عنوان الإشعار مطلوب"],
      trim: true,
      maxlength: [200, "العنوان يجب ألا يتجاوز 200 حرف"],
    },

    subtitle: {
      type: String,
      required: [true, "النص الفرعي للإشعار مطلوب"],
      trim: true,
      maxlength: [500, "النص الفرعي يجب ألا يتجاوز 500 حرف"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtual: student 
NotificationSchema.virtual("student", {
  ref: "Student",
  localField: "studentId",
  foreignField: "_id",
  justOne: true,
  options: { select: "userName profilePhoto" },
});

// indexes 
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ studentId: 1 });

// Model 
export const Notification: Model<NotificationDocument> =
  mongoose.model<NotificationDocument>(
    "Notification",
    NotificationSchema
  );
