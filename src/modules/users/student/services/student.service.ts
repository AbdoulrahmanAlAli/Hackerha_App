import bcrypt from "bcrypt";
import { Student } from "../models/student.model";
import {
  passwordSchema,
  resetPassSchema,
  sendEmailSchema,
  updateDeviceIdResetSchema,
  updateFcmTokenSchema,
  UpdateImportantStudentInput,
  updateImportantStudentSchema,
  UpdateStudentInput,
  updateStudentSchema,
  updateSuspendedStudentSchema,
} from "../schemas/student.schemas";

import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";

// utils قديمة (انقلها أو عدّل paths)
import { OTPUtils } from "../../../../shared/otp/otpUtils";
import { sendEmail } from "../../../../shared/mailer/sendEmail";
import { resetPasswordHtml } from "../../../../shared/mailer/templates";
import { IStudent } from "../types/student.types";
import { parse } from "node:path";

export class StudentService {
  // ~ Get => /api/hackit/ctrl/student ~ Get All Student
  static async getAllStudents(universityNumber?: number, phoneNumber?: string) {
    const query: any = {};
    if (universityNumber) query.universityNumber = universityNumber;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    return Student.find(query)
      .select(
        "firstName lastName device_id phoneNumber email universityNumber academicYear gender birth profilePhoto available suspended enrolledCourses createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  // ~ Get => /api/hackit/ctrl/student/accountprofilestudent ~ Get Profile Student
  static async getProfileStudent(id: string) {
    const existing = await Student.findById(id);
    if (!existing) throw badRequest("المستخدم غير موجود");
    if (!existing.available) throw badRequest("الحساب غير مفعل");
    if (existing.suspended) throw badRequest("حسابك مقيد");

    const student = await Student.findById(id).select(
      "-suspended -available -resetPass -createdAt -updatedAt -__v -favoriteCourses -favoriteSessions -favoriteBank -enrolledCourses -banks -contents"
    );

    if (!student) throw notFound("الطالب غير موجود");
    return student;
  }

  // ~ Post => /api/hackit/ctrl/student/sendemailpassword ~ Send Email For Password For Student
  static async sendEmailForPassword(studentData: Pick<IStudent, "email">) {
    try {
      sendEmailSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findOne({
      email: studentData.email,
      available: true,
    });
    if (!student) throw badRequest("البريد الإلكتروني غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");

    const otp = OTPUtils.generateOTP();
    const hashedOtp = await OTPUtils.encryptOTP(otp);

    student.otp = hashedOtp;
    student.resetPass = false;
    await student.save();

    try {
      await sendEmail({
        to: student.email,
        subject: "رمز إعادة تعيين كلمة المرور - حساب طالب",
        text: `رمز التحقق الخاص بك لإعادة تعيين كلمة المرور هو: ${otp}`,
        html: resetPasswordHtml(otp),
      });
    } catch {
      throw badRequest(
        "فشل في إرسال بريد إعادة تعيين كلمة المرور، يرجى المحاولة مرة أخرى"
      );
    }

    return {
      message: "تم إرسال كود التحقق الخاص بك، يرجى التحقق من بريدك الإلكتروني",
      id: student.id,
    };
  }

  // ~ Post => /api/hackit/ctrl/student/forgetPass/:id ~ Forget Password For Student
  static async forgetPassword(otpData: { otp: string }, id: string) {
    try {
      resetPassSchema.parse(otpData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id).select("+otp");
    if (!student) throw badRequest("المستخدم غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");

    const isValidOtp = await OTPUtils.verifyOTP(otpData.otp, student.otp);
    if (!isValidOtp) throw badRequest("رمز التحقق غير صحيح");

    student.otp = "";
    student.resetPass = true;
    await student.save();

    return { message: "تم التحقق من الكود" };
  }

  // ~ Put => /api/hackit/ctrl/student/changepass/:id ~ Change Password For Student
  static async changePassword(studentData: { password: string }, id: string) {
    try {
      passwordSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id).select("+password");
    if (!student) throw badRequest("المستخدم غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");
    if (!student.resetPass) throw badRequest("غير مسموح لك بتغيير كلمة السر");

    const isSamePassword = await bcrypt.compare(
      studentData.password,
      student.password
    );
    if (isSamePassword) {
      throw badRequest("كلمة السر الجديدة يجب أن تكون مختلفة عن القديمة");
    }

    // الأفضل: set + save لتفعيل pre-save hashing
    student.password = studentData.password;
    student.resetPass = false;
    await student.save();

    return { message: "تم تحديث كلمة السر بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/updatedetailsprofile/:id ~ Change details of student
  static async updateProfileStudent(
    studentData: UpdateStudentInput,
    id: string
  ) {
    let parsed: UpdateStudentInput;
    try {
      parsed = updateStudentSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id);
    if (!student) throw badRequest("المستخدم غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");

    if (parsed.firstName !== undefined) student.firstName = parsed.firstName;
    if (parsed.lastName !== undefined) student.lastName = parsed.lastName;
    if (parsed.phoneNumber !== undefined)
      student.phoneNumber = parsed.phoneNumber;
    if (parsed.academicYear !== undefined)
      student.academicYear = parsed.academicYear;

    await student.save();
    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/UpdateProfileSuspendedStudent/:id
  static async updateProfileSuspendedStudent(
    studentData: { suspended: boolean; suspensionReason: string },
    id: string
  ) {
    try {
      updateSuspendedStudentSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id);
    if (!student) throw badRequest("المستخدم غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");

    student.suspended = studentData.suspended;
    student.suspensionReason = studentData.suspensionReason;
    await student.save();

    return { message: "تم تحديث تقييد الحساب بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/UpdateProfileImpStudentAdmin/:id
  static async updateProfileImpStudentAdmin(
    studentData: UpdateImportantStudentInput,
    id: string
  ) {
    let parsed: UpdateImportantStudentInput;
    try {
      parsed = updateImportantStudentSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id);
    if (!student) throw badRequest("المستخدم غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");

    if (parsed.firstName) student.firstName = parsed.firstName;
    if (parsed.lastName) student.lastName = parsed.lastName;
    if (parsed.phoneNumber) student.phoneNumber = parsed.phoneNumber;
    if (parsed.academicYear) student.academicYear = parsed.academicYear;
    if (parsed.universityNumber)
      student.universityNumber = parsed.universityNumber;
    if (parsed.birth) student.birth = parsed.birth;
    if (parsed.email) student.email = parsed.email;
    if (parsed.device_id) student.device_id = parsed.device_id;

    await student.save();
    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/update-fcm-token/:id
  static async updateFcmToken(studentData: Partial<IStudent>, id: string) {
    try {
      updateFcmTokenSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id);
    if (!student) throw notFound("الطالب غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");

    student.fcmToken = studentData.fcmToken ?? null;
    await student.save();

    return { message: "تم تحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/student/update-device-id-reset/:id (Admin Only)
  static async updateDeviceIdReset(studentData: Partial<IStudent>, id: string) {
    try {
      updateDeviceIdResetSchema.parse(studentData);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id);
    if (!student) throw notFound("الطالب غير موجود");

    student.device_id_reset = Boolean(studentData.device_id_reset);
    await student.save();

    return {
      message: "تم تحديث device_id_reset بنجاح",
      device_id_reset: student.device_id_reset,
    };
  }

  // ~ Get => /api/hackit/ctrl/student/check-existence
  static async checkStudentExistence(checkData: {
    phoneNumber?: string;
    email?: string;
    universityNumber?: number;
  }) {
    const { phoneNumber, email, universityNumber } = checkData;

    if (!phoneNumber && !email && !universityNumber) {
      throw badRequest(
        "يجب تقديم رقم الهاتف أو البريد الإلكتروني أو الرقم الجامعي للتحقق"
      );
    }

    const result: any = {};

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        throw badRequest("صيغة البريد الإلكتروني غير صحيحة");

      const exists = await Student.findOne({ email, available: true })
        .select("_id")
        .lean();
      result.emailExists = !!exists;
    }

    if (phoneNumber) {
      let processed = phoneNumber;
      if (processed.startsWith("0")) processed = processed.substring(1);

      const exists = await Student.findOne({
        phoneNumber: processed,
        available: true,
      })
        .select("_id")
        .lean();

      result.phoneNumberExists = !!exists;
    }

    if (typeof universityNumber === "number") {
      if (universityNumber <= 0)
        throw badRequest("الرقم الجامعي يجب أن يكون رقمًا موجبًا");

      const exists = await Student.findOne({
        universityNumber,
        available: true,
      })
        .select("_id")
        .lean();

      result.universityNumberExists = !!exists;
    }

    return result;
  }

  // ~ Delete => /api/hackit/ctrl/student/account/:id ~ Delete Student Account
  static async deleteStudentAccount(id: string) {
    const student = await Student.findById(id);
    if (!student) throw badRequest("المستخدم غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");

    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) throw badRequest("فشل في حذف الحساب");

    return { message: "تم حذف الحساب بنجاح" };
  }
}
