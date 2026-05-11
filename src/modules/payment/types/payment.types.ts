import mongoose from "mongoose";
import { Types } from "mongoose";

// ===== Document Type =====
export interface PaymentDocument extends mongoose.Document {
  code: string;
  universityNumber: number;
  price: string;
  courseId: Types.ObjectId;
  studentId?: Types.ObjectId | null;
  adminName?: string;
  studentNumber?: string;
  used: boolean;
  expiresAt: Date;
  compareCode(candidateCode: string): Promise<boolean>;
}