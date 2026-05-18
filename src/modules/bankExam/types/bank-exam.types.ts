import { Document, Types } from "mongoose";

export interface IBankExam extends Document {
  number: number;
  bankId: Types.ObjectId;
  title: string;
  totalMark: number;
  available: boolean;
  duration: string; // "00:00" or "00:00:00"
  pdfUrl: string;  // إضافة حقل pdfUrl
  
  // Virtuals
  questions?: Types.ObjectId[];
}