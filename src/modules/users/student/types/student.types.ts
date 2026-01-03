import type { HydratedDocument, Types } from "mongoose";

export type AcademicYear =
  | "السنة الأولى"
  | "السنة الثانية"
  | "السنة الثالثة"
  | "السنة الرابعة"
  | "السنة الخامسة";

export type Gender = "ذكر" | "انثى";

export interface IStudent {
  profilePhoto: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  academicYear: AcademicYear;
  universityNumber: number;
  gender: Gender;
  birth: Date;
  email: string;
  password: string;
  otp: string;
  fcmToken?: string | null;
  device_id: string;
  device_id_reset: boolean;
  available: boolean;
  suspended: boolean;
  resetPass: boolean;
  suspensionReason?: string;
  suspensionEnd?: Date;

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

export type StudentDocument = HydratedDocument<IStudent> & {
  _id: Types.ObjectId;
};

export interface IOtp {
  otp: string;
}

export interface IUpdateFcmToken {
  fcmToken?: string | null;
}

export interface IUpdateDeviceIdReset {
  device_id_reset: boolean;
}
