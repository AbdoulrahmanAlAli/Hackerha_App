import mongoose, { Types } from "mongoose";

export interface NotificationDocument extends mongoose.Document {
  studentId?: Types.ObjectId | null;
  type: "alert" | "new" | "success" | "discount" | "connection";
  title: string;
  subtitle: string;
}
