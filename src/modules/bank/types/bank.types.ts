import { Document, Types } from "mongoose";

// تعريف واجهة البنك داخل MongoDB
export interface IBank extends Document {
  title: string;
  totalMark: number;
  duration: string;
  available: boolean;

  // Virtuals
  groups?: Types.ObjectId[];
  questions?: Types.ObjectId[];
}