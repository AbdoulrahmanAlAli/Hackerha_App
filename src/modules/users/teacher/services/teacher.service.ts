import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { Teacher } from "../models/teacher.model";
import {
  badRequest,
  notFound,
  forbidden,
} from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import {
  updateTeacherSchema,
  updateTeacherImportantSchema,
  updateTeacherSuspendedSchema,
  sendEmailSchema,
  otpSchema,
  passwordSchema,
} from "../schemas/teacher.schema";
import { OTPUtils } from "../../../../shared/otp/otpUtils";
import { UpdateTeacherInput } from "../types/teacher.types";



export class CtrlTeacherService {
  static async getProfileTeacher(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    const teacher = await Teacher.findById(id).select("-password -otp");
    if (!teacher) throw notFound("المعلم غير موجود");

    if (!teacher.available) throw badRequest("الحساب غير مفعل");
    if (teacher.suspended) throw forbidden("حسابك مقيد");

    return teacher;
  }

  static async getTeachers() {
    const teachers = await Teacher.find()
      .select("-password -otp")
      .sort({ createdAt: -1 });
    return teachers;
  }

  static async updateProfileTeacher(id: string, data: UpdateTeacherInput) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    let parsed: any;
    try {
      parsed = updateTeacherSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) throw notFound("المعلم غير موجود");
    if (!teacher.available) throw badRequest("الحساب غير مفعل");
    if (teacher.suspended) throw forbidden("حسابك مقيد");

    // تحديث بسيط بدون تعقيد types
    if (parsed.firstName) teacher.firstName = parsed.firstName;
    if (parsed.lastName) teacher.lastName = parsed.lastName;
    if (parsed.phoneNumber) teacher.phoneNumber = parsed.phoneNumber;
    if (parsed.about !== undefined) teacher.about = parsed.about;
    if (parsed.profilePhoto) teacher.profilePhoto = parsed.profilePhoto;

    await teacher.save();
    return { message: "تم التحديث بنجاح" };
  }

  static async updateImportantTeacherAdmin(id: string, data: any) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    let parsed: any;
    try {
      parsed = updateTeacherImportantSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) throw notFound("المعلم غير موجود");

    if (parsed.firstName) teacher.firstName = parsed.firstName;
    if (parsed.lastName) teacher.lastName = parsed.lastName;
    if (parsed.phoneNumber) teacher.phoneNumber = parsed.phoneNumber;
    if (parsed.gender) teacher.gender = parsed.gender;
    if (parsed.birth) teacher.birth = parsed.birth;
    if (parsed.email) teacher.email = parsed.email;

    await teacher.save();
    return { message: "تم التحديث بنجاح" };
  }

  static async updateSuspendedTeacherAdmin(id: string, data: any) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    let parsed: any;
    try {
      parsed = updateTeacherSuspendedSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) throw notFound("المعلم غير موجود");

    teacher.suspended = parsed.suspended;
    teacher.suspensionReason = parsed.suspensionReason ?? "";
    teacher.suspensionEnd = parsed.suspensionEnd ?? null;

    await teacher.save();
    return { message: "تم تحديث حالة التقييد بنجاح" };
  }

  // ===== Forgot Password Flow =====

  static async sendResetPasswordOtp(data: { email: string }) {
    let parsed: any;
    try {
      parsed = sendEmailSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const teacher = await Teacher.findOne({
      email: parsed.email,
      available: true,
    });
    if (!teacher) throw badRequest("البريد الإلكتروني غير موجود");
    if (teacher.suspended) throw forbidden("حسابك مقيد");

    const otp = OTPUtils.generateOTP();
    teacher.otp = await OTPUtils.encryptOTP(otp);
    teacher.resetPass = false;

    await teacher.save();

    return {
      message: "تم إرسال كود التحقق، يرجى التحقق من بريدك الإلكتروني",
      id: teacher.id,
    };
  }

  static async verifyResetOtp(id: string, data: { otp: string }) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    let parsed: any;
    try {
      parsed = otpSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const teacher = await Teacher.findById(id).select("+otp");
    if (!teacher) throw notFound("المعلم غير موجود");
    if (!teacher.available) throw badRequest("الحساب غير مفعل");
    if (teacher.suspended) throw forbidden("حسابك مقيد");

    const ok = await OTPUtils.verifyOTP(parsed.otp, teacher.otp || "");
    if (!ok) throw badRequest("رمز التحقق غير صحيح");

    teacher.otp = "";
    teacher.resetPass = true;
    await teacher.save();

    return { message: "تم التحقق من الكود" };
  }

  static async changePassword(id: string, data: { password: string }) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    let parsed: any;
    try {
      parsed = passwordSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // نحتاج كلمة المرور القديمة للمقارنة
    const teacher = await Teacher.findById(id).select("+password");
    if (!teacher) throw notFound("المعلم غير موجود");
    if (!teacher.available) throw badRequest("الحساب غير مفعل");
    if (teacher.suspended) throw forbidden("حسابك مقيد");
    if (!teacher.resetPass) throw badRequest("غير مسموح لك بتغيير كلمة السر");

    const same = await bcrypt.compare(parsed.password, teacher.password);
    if (same)
      throw badRequest("كلمة السر الجديدة يجب أن تكون مختلفة عن القديمة");

    teacher.password = parsed.password; // pre-save سيشفرها
    teacher.resetPass = false;
    await teacher.save();

    return { message: "تم تحديث كلمة السر بنجاح" };
  }

  static async deleteTeacherAccount(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    const teacher = await Teacher.findById(id);
    if (!teacher) throw notFound("المعلم غير موجود");
    if (!teacher.available) throw badRequest("الحساب غير مفعل");
    if (teacher.suspended) throw forbidden("حسابك مقيد");

    await Teacher.findByIdAndDelete(id);
    return { message: "تم حذف الحساب بنجاح" };
  }
}
