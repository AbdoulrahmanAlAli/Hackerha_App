import { Document, Types } from "mongoose";

export type YearType = 
  | "السنة الأولى"
  | "السنة الثانية"
  | "السنة الثالثة"
  | "السنة الرابعة"
  | "السنة الخامسة";

export type SemesterType = "الفصل الأول" | "الفصل الثاني";

// تعريف واجهة البنك داخل MongoDB
export interface IBank extends Document {
  title: string;
  totalMark: number;
  duration: string;
  available: boolean;
  year: YearType;
  semester: SemesterType;
  questions?: Types.ObjectId[];
}