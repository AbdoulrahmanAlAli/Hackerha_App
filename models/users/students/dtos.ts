import { Document, Types } from "mongoose";

export interface IStudent extends Document {
  profilePhoto: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  academicYear:
    | "السنة الأولى"
    | "السنة الثانية"
    | "السنة الثالثة"
    | "السنة الرابعة"
    | "السنة الخامسة";
  universityNumber: number;
  gender: "ذكر" | "أنثى";
  birth: Date;
  email: string;
  password: string;
  otp: string;
  fcmToken?: string;
  device_id: string;
  device_id_reset: boolean;
  available: boolean;
  suspended: boolean;
  resetPass: boolean;
  suspensionReason: string;
  suspensionEnd: Date;
  favoriteCourses: Types.ObjectId[];
  favoriteSessions: Types.ObjectId[];
  favoriteBank: Types.ObjectId[];
  enrolledCourses: Types.ObjectId[];
  banks: Types.ObjectId[];
  contents: Types.ObjectId[];
  courses: Types.ObjectId[];
  sessions: Types.ObjectId[];
  exams: Types.ObjectId[];
}

export interface IOtp extends Document {
  otp: string;
}

export interface IUpdateFcmToken {
  fcmToken?: string;
}

export interface IUpdateDeviceIdReset {
  device_id_reset: boolean;
}
