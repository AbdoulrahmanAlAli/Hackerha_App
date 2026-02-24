import mongoose from "mongoose";

// ===== Document Type =====
export interface TeacherInvoiceDetail {
  teacherId: string;
  priceTaken: number;
  total: number;
  notes?: string;
}

export interface TeacherInvoiceDocument extends mongoose.Document {
  teacherId: mongoose.Types.ObjectId;
  priceTaken: number;
  total: number;
  notes?: string;
}