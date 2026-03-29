import type { HydratedDocument, Types } from "mongoose";

export type Gender = "ذكر" | "انثى";

export interface ITeacher {
  profilePhoto: string;
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  birth: Date;
  email: string;
  password: string;

  otp?: string; // مخزن مشفّر
  about: string;

  available: boolean;
  suspended: boolean;

  resetPass: boolean;
  suspensionReason: string;
  suspensionEnd: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateTeacherInput = Partial<
  Pick<
    ITeacher,
    "fullName" | "phoneNumber" | "profilePhoto" | "about"
  >
>;

export type UpdateTeacherImportantInput = Partial<
  Pick<
    ITeacher,
    "fullName" | "phoneNumber" | "gender" | "email"
  >
>;

export type UpdateTeacherSuspendedInput = {
  suspended: boolean;
  suspensionReason: string;
  suspensionEnd: Date;
};