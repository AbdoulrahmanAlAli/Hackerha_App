import { Document, Types } from "mongoose";

export interface ICourse extends Document {
  image: string;
  name: string;
  teacher: Types.ObjectId;
  description: string;
  price: number;
  note: string;
  type: "نظري" | "عملي" | "شاملة";
  discount: {
    dis: boolean;
    rate: number;
  };
  year:
    | "السنة الأولى"
    | "السنة الثانية"
    | "السنة الثالثة"
    | "السنة الرابعة"
    | "السنة الخامسة";
  semester: "الفصل الأول" | "الفصل الثاني";
  rating: number;
  about: string;
  available: boolean;
  maintenance: boolean;
  video: string;
  free: boolean;
  students: Types.ObjectId[];
  whatsapp: string;

  // fake count
  fakeCount: number;

  // Virtual fields (populated)
  sessions?: Types.ObjectId[];
  exams?: Types.ObjectId[];
  comments?: Types.ObjectId[];

  // Virtual computed fields
  discountedPrice?: number;
}
