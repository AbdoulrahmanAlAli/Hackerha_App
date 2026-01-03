import mongoose, { Document, Types } from "mongoose";

export const courseTypes = ["نظري", "عملي", "شاملة"] as const;
export const courseYears = [
  "السنة الأولى",
  "السنة الثانية",
  "السنة الثالثة",
  "السنة الرابعة",
  "السنة الخامسة",
] as const;

export const courseSemesters = ["الفصل الأول", "الفصل الثاني"] as const;

export type CourseType = (typeof courseTypes)[number];
export type CourseYear = (typeof courseYears)[number];
export type CourseSemester = (typeof courseSemesters)[number];

export interface ICourseDiscount {
  dis: boolean;
  rate?: number; // required when dis=true (validated in Zod)
}

export interface ICourse extends Document {
  image: string;
  name: string;
  teacher: Types.ObjectId;

  description: string;
  price: number;

  note?: string;
  whatsapp?: string | null;

  type: CourseType;
  discount: ICourseDiscount;

  year: CourseYear;
  semester: CourseSemester;

  rating: number;
  about: string;

  available: boolean;
  maintenance: boolean;

  video?: string;
  free: boolean;

  students: Types.ObjectId[];

  fakeCount: number;

  // virtuals (populated)
  sessions?: Types.ObjectId[];
  exams?: Types.ObjectId[];
  comments?: Types.ObjectId[];

  // virtual computed
  discountedPrice?: number;
}

export type CourseDocument = ICourse & mongoose.Document;

// inputs for services
export type CreateCourseInput = {
  image: string;
  name: string;
  teacher: string; // ObjectId string
  description: string;
  price: number;
  note?: string;
  whatsapp?: string | null;
  type: CourseType;
  discount: ICourseDiscount;
  year: CourseYear;
  semester: CourseSemester;
  about: string;
  video?: string;
  free?: boolean;
};

export type UpdateCourseInput = Partial<CreateCourseInput> & {
  available?: boolean;
  maintenance?: boolean;
  fakeCount?: number;
  rating?: number;
};

// Actor for Get Single Course
export type Actor =
  | { role: "student"; id: string }
  | { role: "admin" | "teacher"; id?: string };

