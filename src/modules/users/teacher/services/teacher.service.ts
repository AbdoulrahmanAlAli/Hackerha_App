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
import { Course } from "../../../course/models/course.model";
import { Payment } from "../../../payment/models/payment.model";

export class CtrlTeacherService {
  // ~ Get => /api/hackit/ctrl/teacher/profile/:id ~ Get Profile Teacher
  static async getProfileTeacher(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    const teacher = await Teacher.findById(id).select("-password -otp").lean();

    if (!teacher) throw notFound("المعلم غير موجود");

    if (!teacher.available) throw badRequest("الحساب غير مفعل");
    if (teacher.suspended) throw forbidden("حسابك مقيد");

    const courses = await Course.find({ teacher: id })
      .select("_id name price students")
      .lean();

    const totalStudents = courses.reduce((sum, course) => {
      return sum + (course.students?.length || 0);
    }, 0);

    const courseIds = courses.map((course) => course._id);
    const payments = await Payment.find({
      courseId: { $in: courseIds },
    }).lean();

    const paymentsStats = {
      totalPayments: payments.length,
      totalRevenue: payments.reduce((sum, payment) => sum + payment.price, 0),
      usedPayments: payments.filter((p) => p.used).length,
      unusedPayments: payments.filter((p) => !p.used).length,
      expiredPayments: payments.filter(
        (p) => new Date(p.expiresAt) < new Date(),
      ).length,
    };

    return {
      ...teacher,
      paymentsStats,
      courses,
      totalStudents,
    };
  }

  // ~ Get => /api/hackit/ctrl/teacher/all ~ Get All Teachers
  static async getTeachers() {
    // جلب جميع المدرسين
    const teachers = await Teacher.find()
      .select("-password -otp")
      .sort({ createdAt: -1 })
      .lean(); // استخدام lean() للحصول على كائنات JavaScript عادية لتعديلها

    // جلب جميع الكورسات مع الحقول المطلوبة فقط
    const courses = await Course.find(
      { teachers: { $in: teachers.map(t => t._id) }, available: true },
      { name: 1, teachers: 1, year: 1, _id: 0 }
    ).lean();

    // إضافة البيانات لكل مدرس
    const teachersWithCoursesInfo = teachers.map(teacher => {
      // فلترة الكورسات الخاصة بهذا المدرس
      const teacherCourses = courses.filter(course => 
        course.teachers.some(teacherId => 
          teacherId.toString() === teacher._id.toString()
        )
      );

      // استخراج أسماء الكورسات فقط
      const courseNames = teacherCourses.map(course => course.name);

      // استخراج السنوات بدون تكرار
      const years = [...new Set(teacherCourses.map(course => course.year))];

      return {
        ...teacher,
        coursesNames: courseNames,      // قائمة بأسماء الكورسات
        years: years              // قائمة بالسنوات بدون تكرار
      };
    });

    return teachersWithCoursesInfo;
  }

  // ~ Get => /api/hackit/ctrl/teacher/profile/:id ~ Update Profile Teacher
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
    if (parsed.fullName) teacher.fullName = parsed.fullName;
    if (parsed.phoneNumber) teacher.phoneNumber = parsed.phoneNumber;
    if (parsed.about) teacher.about = parsed.about;
    if (parsed.profilePhoto) teacher.profilePhoto = parsed.profilePhoto;

    await teacher.save();
    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/teacher/update-important/:id ~ Update Important Details Teacher (admin)
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

    if (parsed.fullName) teacher.fullName = parsed.fullName;
    if (parsed.phoneNumber) teacher.phoneNumber = parsed.phoneNumber;
    if (parsed.gender) teacher.gender = parsed.gender;
    if (parsed.email) teacher.email = parsed.email;
    if (parsed.about) teacher.about = parsed.about;

    await teacher.save();
    return { message: "تم التحديث بنجاح" };
  }

  // ~ Put => /api/hackit/ctrl/teacher/update-suspended/:id ~ Update Suspended Teacher (admin)
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

  // ~ Post => /api/hackit/ctrl/teacher/sendemailpassword ~ Send Email For Change Password
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

  // ~ Post => /api/hackit/ctrl/teacher/forgetPass/:id ~ Verfiy Otp
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

  // ~ Put => /api/hackit/ctrl/teacher/changepass ~ Change Password
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

  // ~ Get => /api/hackit/ctrl/teacher/account/:id ~ Delete Account
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
