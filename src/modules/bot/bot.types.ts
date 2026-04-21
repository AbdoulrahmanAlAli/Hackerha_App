import { Types } from "mongoose";

export interface TelegramCourseItem {
  _id: Types.ObjectId | string;
  name: string;
  price: number;
  discountedPrice: number;
  isDiscounted: boolean;
  discount?: {
    dis: boolean;
    rate: number;
  };
  teachers: Array<{
    _id?: string;
    fullName?: string;
    name?: string;
  }>;
  free?: boolean;
  available?: boolean;
  maintenance?: boolean;
}

export interface EnrollWizardSession {
  universityBranch?: "دمشق" | "حلب";
  year?:
    | "السنة الأولى"
    | "السنة الثانية"
    | "السنة الثالثة"
    | "السنة الرابعة"
    | "السنة الخامسة";
  semester?: "الفصل الأول" | "الفصل الثاني";
  selectedCourseId?: string;
  selectedCourseName?: string;
  selectedCourseFinalPrice?: number;
}