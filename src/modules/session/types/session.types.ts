import { Document, Types } from "mongoose";

export interface ISession extends Document {
  number: number;
  courseId: Types.ObjectId;

  // video
  video: string;

  // اسم الجلسة
  name: string;

  // تفاعل الطلاب
  likes: Types.ObjectId[];
  disLikes: Types.ObjectId[];

  // ملاحظات
  note?: string;

  // مدة الفيديو
  duration: string;

  // حالة الجلسة
  available: boolean;

  // Virtual (مش مخزن في الدوك)
  files?: Types.ObjectId[];
}
