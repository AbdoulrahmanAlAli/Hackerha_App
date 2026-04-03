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

export type University_Branch = "دمشق" | "حلب";

export type CourseType = (typeof courseTypes)[number];
export type CourseYear = (typeof courseYears)[number];
export type CourseSemester = (typeof courseSemesters)[number];

export interface ICourseDiscount {
  dis: boolean;
  rate?: number;
}

export interface ICourse extends Document {
  image: string;
  name: string;

  // صار مجموعة أساتذة بدل أستاذ واحد
  teachers: Types.ObjectId[];

  universityBranch: University_Branch;

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

  // virtuals
  sessions?: Types.ObjectId[];
  exams?: Types.ObjectId[];
  comments?: Types.ObjectId[];

  // virtual computed
  discountedPrice?: number;
}

export type CourseDocument = ICourse & mongoose.Document;

export type CreateCourseInput = {
  image: string;
  name: string;
  teachers: string[];
  universityBranch: University_Branch;
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

export type Actor =
  | { role: "student"; id: string }
  | { role: "admin" | "teacher"; id?: string };