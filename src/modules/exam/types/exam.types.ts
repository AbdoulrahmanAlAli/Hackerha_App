import { Document, Types } from "mongoose";

export interface IExam extends Document {
  number: number;
  courseId: Types.ObjectId;

  title: string;
  totalMark: number;

  available: boolean;
  
  // "00:00" أو "00:00:00"
  duration: string;

  // Virtuals
  groups?: Types.ObjectId[];
}
