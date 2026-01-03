import bcrypt from "bcrypt";
import { Student } from "../models/student.model";
import {
  CreateStudentInput,
  createStudentSchema,
  LoginStudentInput,
  loginStudentSchema,
  otpSchema,
} from "../schemas/student.schemas";
import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import { OTPUtils } from "../../../../shared/otp/otpUtils";
import { register } from "../../../../shared/mailer/templates";
import { sendEmail } from "../../../../shared/mailer/sendEmail";
import { IOtp } from "../types/student.types";
import { signAccessToken } from "../../../../shared/security/jwt";

export class AuthStudentService {
  // ~ Post => /api/hackit/ctrl/student/register ~ Create New Student
  static async createNewStudent(studentData: CreateStudentInput) {
    let parsed: CreateStudentInput;
    try {
      parsed = createStudentSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // حذف الحسابات غير المفعلة لنفس البريد/الرقم (مثل القديم)
    const existingInactiveByEmail = await Student.findOne({
      email: parsed.email,
      available: false,
    });
    if (existingInactiveByEmail)
      await Student.findByIdAndDelete(existingInactiveByEmail._id);

    const existingInactiveByPhone = await Student.findOne({
      phoneNumber: parsed.phoneNumber,
      available: false,
    });
    if (existingInactiveByPhone)
      await Student.findByIdAndDelete(existingInactiveByPhone._id);

    // تحقق من التكرار للحسابات المفعلة
    const [existingByPhone, existingByEmail, existingByUni] = await Promise.all(
      [
        Student.findOne({ phoneNumber: parsed.phoneNumber, available: true }),
        Student.findOne({ email: parsed.email, available: true }),
        Student.findOne({
          universityNumber: parsed.universityNumber,
          available: true,
        }),
      ]
    );

    if (existingByPhone) throw badRequest("رقم الهاتف مسجل مسبقاً");
    if (existingByEmail) throw badRequest("البريد الإلكتروني مسجل مسبقاً");
    if (existingByUni) throw badRequest("الرقم الجامعي مسجل مسبقاً");

    const otp = OTPUtils.generateOTP();
    const hashedOtp = await OTPUtils.encryptOTP(otp);

    const student = await Student.create({
      ...parsed,
      otp: hashedOtp,
      available: false,
    });

    try {
      await sendEmail({
        to: student.email,
        subject: "رمز التحقق - حساب طالب",
        text: `رمز التحقق الخاص بك هو: ${otp}`,
        html: register(otp),
      });
    } catch (emailError) {
      await Student.findByIdAndDelete(student._id);
      throw badRequest("فشل في إرسال بريد التحقق، يرجى المحاولة مرة أخرى");
    }

    return {
      message: "تم إنشاء الحساب بنجاح، يرجى التحقق من بريدك الإلكتروني",
      id: student.id,
    };
  }

  // ~ Post => /api/hackit/ctrl/student/verifyotp/:id ~ verifyOtp
  static async verifyOtp(otpData: IOtp, studentId: string) {
    try {
      otpSchema.parse(otpData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(studentId).select("+otp");
    if (!student) throw notFound("الحساب غير موجود");
    if (student.available) throw badRequest("الحساب مفعل بالفعل");

    const isValidOtp = await OTPUtils.verifyOTP(otpData.otp, student.otp);
    if (!isValidOtp) throw badRequest("رمز التحقق غير صحيح");

    const token = signAccessToken({ id: studentId, role: "student" });

    student.available = true;
    student.otp = "";
    await student.save();

    return { message: "تم تفعيل الحساب بنجاح", token };
  }

  // ~ Post => /api/hackit/ctrl/student/login ~ Login Student
  static async loginStudent(studentData: LoginStudentInput) {
    let parsed: LoginStudentInput;
    try {
      parsed = loginStudentSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findOne({
      email: parsed.email,
      available: true,
    }).select("+password");

    if (!student) throw notFound("البريد الإلكتروني أو كلمة المرور غير صحيحة");

    const isPasswordValid = await bcrypt.compare(
      parsed.password,
      student.password
    );
    if (!isPasswordValid)
      throw badRequest("البريد الإلكتروني أو كلمة المرور غير صحيحة");

    if (student.suspended) {
      throw badRequest(
        "حسابك مقيد لا يمكنك تسجيل الدخول, يرجى التواصل بالدعم التقني"
      );
    }

    // إذا كان reset للجهاز مفعّل
    if (student.device_id_reset) {
      student.device_id = parsed.device_id;
      student.device_id_reset = false;
      await student.save();

      const token = signAccessToken({ id: student.id, role: "student" });
      return {
        message: "تم تسجيل الدخول بنجاح وتم تحديث معرف الجهاز",
        token,
        deviceUpdated: true,
      };
    }

    // إذا جهاز مختلف -> قيّد الحساب
    if (student.device_id !== parsed.device_id) {
      student.suspended = true;
      student.suspensionReason = "تسجيل الدخول من غير حساب";
      await student.save();

      throw badRequest(
        "يتم تسجيل الدخول من غير جهاز, تم تقييد الحساب, يرجى التواصل معنا"
      );
    }

    const token = signAccessToken({ id: student.id, role: "student" });
    return { message: "تم تسجيل الدخول بنجاح", token };
  }

  // ~ Post => /api/hackit/ctrl/student/reSendOtp/:id ~ reSend Otp
  static async reSendOtp(otpData: IOtp, studentId: string) {
    try {
      otpSchema.parse(otpData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(studentId);
    if (!student) throw notFound("الحساب غير موجود");

    const otp = OTPUtils.generateOTP();
    const hashedOtp = await OTPUtils.encryptOTP(otp);

    student.otp = hashedOtp;
    await student.save();

    try {
      await sendEmail({
        to: student.email,
        subject: "رمز التحقق - حساب طالب",
        text: `رمز التحقق الخاص بك هو: ${otp}`,
        html: register(otp),
      });
    } catch {
      throw badRequest("فشل في إرسال بريد التحقق، يرجى المحاولة مرة أخرى");
    }

    return { message: "تم إعادة إرسال الرمز بنجاح" };
  }
}
