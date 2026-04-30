import bcrypt from "bcrypt";
import { Student } from "../models/student.model";
import {
  passwordSchema,
  RefreshTokenInput,
  refreshTokenSchema,
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
import { OTPUtils } from "../../../../shared/otp/otpUtils";
import { sendEmail } from "../../../../shared/mailer/sendEmail";
import { resetPasswordHtml } from "../../../../shared/mailer/templates";
import { IStudent } from "../types/student.types";
import { parse } from "node:path";
import { Course } from "../../../course/models/course.model";
import { Exam } from "../../../exam/models/exam.model";
import { Session } from "../../../session/models/session.model";
import mongoose, { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { JwtPayload, signAccessToken, verifyAccessToken } from "../../../../shared/security/jwt";
import crypto from 'crypto';

export class StudentService {
  // ~ Get => /api/hackit/ctrl/student ~ Get All Student
  static async getAllStudents(universityNumber?: number, phoneNumber?: string) {
    const query: any = {};
    if (universityNumber) query.universityNumber = universityNumber;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    return Student.find(query)
      .select(
        "fullName device_id phoneNumber email device_id_reset universityNumber universityBranch academicYear gender profilePhoto available suspended suspensionReason enrolledCourses createdAt",
      )
      .populate("enrolledCourses", "name")
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
      "-suspended -available -resetPass -createdAt -updatedAt -__v -favoriteCourses -favoriteSessions -favoriteBank -enrolledCourses -banks",
    );

    if (!student) throw notFound("الطالب غير موجود");
    return student;
  }


  // student.service.ts - Add this method
  static async getEnrolledCourses(studentId: string) {
    if (!mongoose.isValidObjectId(studentId)) {
      throw badRequest("معرف الطالب غير صالح");
    }

    const student = await Student.findById(studentId)
      .select("enrolledCourses available suspended")
      .populate({
        path: "enrolledCourses",
        populate: {
          path: "instructor",
          select: "fullName profilePhoto"
        }
      })
      .lean();

    if (!student) throw notFound("الطالب غير موجود");
    if (!student.available) throw badRequest("الحساب غير مفعل");
    if (student.suspended) throw badRequest("حسابك مقيد");

    return {
      enrolledCourses: student.enrolledCourses || [],
    };
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
        "فشل في إرسال بريد إعادة تعيين كلمة المرور، يرجى المحاولة مرة أخرى",
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
      student.password,
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
    id: string,
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

    if (parsed.fullName !== undefined) student.fullName = parsed.fullName;
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
    id: string,
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
    id: string,
) {
    let parsed: UpdateImportantStudentInput;
    try {
        parsed = updateImportantStudentSchema.parse(studentData);
    } catch (e) {
        throw badRequest(zodFirstMessage(e));
    }

    const student = await Student.findById(id);
    if (!student) throw badRequest("المستخدم غير موجود");

    // إنشاء كائن التحديث فقط للحقول الموجودة
    const updateData: any = {};
    if (parsed.fullName !== undefined) updateData.fullName = parsed.fullName;
    if (parsed.gender !== undefined) updateData.gender = parsed.gender;
    if (parsed.available !== undefined) updateData.available = parsed.available;
    if (parsed.resetPass !== undefined) updateData.resetPass = parsed.resetPass;
    if (parsed.phoneNumber !== undefined) updateData.phoneNumber = parsed.phoneNumber;
    if (parsed.academicYear !== undefined) updateData.academicYear = parsed.academicYear;
    if (parsed.universityNumber !== undefined) updateData.universityNumber = parsed.universityNumber;
    if (parsed.universityBranch !== undefined) updateData.universityBranch = parsed.universityBranch;
    if (parsed.email !== undefined) updateData.email = parsed.email;
    if (parsed.device_id !== undefined) updateData.device_id = parsed.device_id;
    if (parsed.device_id_reset !== undefined) updateData.device_id_reset = parsed.device_id_reset;

    // استخدام updateOne بدلاً من save()
    await Student.updateOne(
        { _id: id },
        { $set: updateData }
    );

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
        "يجب تقديم رقم الهاتف أو البريد الإلكتروني أو الرقم الجامعي للتحقق",
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

  // ~ Patch => /api/hackit/ctrl/student/favorite/course/:courseId/toggle/:id
  static async toggleFavoriteCourse(studentId: string, courseId: string) {
    if (
      !mongoose.isValidObjectId(studentId) ||
      !mongoose.isValidObjectId(courseId)
    ) {
      throw badRequest("معرف غير صالح");
    }

    const [student, course] = await Promise.all([
      Student.findById(studentId).select("_id"), // existence check
      Course.findById(courseId).select("_id"),
    ]);

    if (!student) throw notFound("الطالب غير موجود");
    if (!course) throw notFound("الكورس غير موجود");

    // حاول إزالة أولاً
    const pullRes = await Student.updateOne(
      { _id: studentId },
      { $pull: { favoriteCourses: new Types.ObjectId(courseId) } },
    );

    if ((pullRes.modifiedCount ?? 0) > 0) {
      return {
        message: "تمت إزالة الكورس من المفضلة",
        action: "removed" as const,
      };
    }

    // لم يُزل => أضف
    await Student.updateOne(
      { _id: studentId },
      { $addToSet: { favoriteCourses: new Types.ObjectId(courseId) } },
    );

    return {
      message: "تمت إضافة الكورس إلى المفضلة",
      action: "added" as const,
    };
  }

  // ~ Patch => /api/hackit/ctrl/student/favorite/session/:sessionId/toggle/:id
  static async toggleFavoriteSession(studentId: string, sessionId: string) {
    if (
      !mongoose.isValidObjectId(studentId) ||
      !mongoose.isValidObjectId(sessionId)
    ) {
      throw badRequest("معرف غير صالح");
    }

    const [student, session] = await Promise.all([
      Student.findById(studentId).select("_id"),
      Session.findById(sessionId).select("_id"),
    ]);

    if (!student) throw notFound("الطالب غير موجود");
    if (!session) throw notFound("الجلسة غير موجودة");

    const pullRes = await Student.updateOne(
      { _id: studentId },
      { $pull: { favoriteSessions: new Types.ObjectId(sessionId) } },
    );

    if ((pullRes.modifiedCount ?? 0) > 0) {
      return {
        message: "تمت إزالة الجلسة من المفضلة",
        action: "removed" as const,
      };
    }

    await Student.updateOne(
      { _id: studentId },
      { $addToSet: { favoriteSessions: new Types.ObjectId(sessionId) } },
    );

    return {
      message: "تمت إضافة الجلسة إلى المفضلة",
      action: "added" as const,
    };
  }

  // ~ Patch => /api/hackit/ctrl/student/course/:courseId/session/:sessionId/user/:id
  static async addCourseAndSessionForStudent(
    studentId: string,
    courseId: string,
    sessionId: string,
  ) {
    if (![studentId, courseId, sessionId].every(mongoose.isValidObjectId)) {
      throw badRequest("معرف غير صالح");
    }

    const [student, course, session] = await Promise.all([
      Student.findById(studentId).select("_id"),
      Course.findById(courseId).select("_id"),
      Session.findById(sessionId).select("courseId"),
    ]);

    if (!student) throw notFound("الطالب غير موجود");
    if (!course) throw notFound("الكورس غير موجود");
    if (!session) throw notFound("الجلسة غير موجودة");

    if (session.courseId.toString() !== courseId) {
      throw badRequest("الجلسة لا تنتمي للكورس المحدد");
    }

    await Student.updateOne(
      { _id: studentId },
      {
        $addToSet: {
          courses: new Types.ObjectId(courseId), // ✅ هنا التعديل
          sessions: new Types.ObjectId(sessionId),
        },
      },
    );

    return { message: "تم تحديث البيانات بنجاح" };
  }

  // ~ Patch => /api/hackit/ctrl/student/course/:courseId/exam/:examId/user/:id
  static async addCourseAndExamForStudent(
    studentId: string,
    courseId: string,
    examId: string,
  ) {
    if (![studentId, courseId, examId].every(mongoose.isValidObjectId)) {
      throw badRequest("معرف غير صالح");
    }

    const [student, course, exam] = await Promise.all([
      Student.findById(studentId).select("_id"),
      Course.findById(courseId).select("_id"),
      Exam.findById(examId).select("courseId"),
    ]);

    if (!student) throw notFound("الطالب غير موجود");
    if (!course) throw notFound("الكورس غير موجود");
    if (!exam) throw notFound("الامتحان غير موجود");

    if (exam.courseId.toString() !== courseId) {
      throw badRequest("الامتحان لا تنتمي للكورس المحدد");
    }

    await Student.updateOne(
      { _id: studentId },
      {
        $addToSet: {
          courses: new Types.ObjectId(courseId), // ✅ هنا التعديل
          exams: new Types.ObjectId(examId),
        },
      },
    );

    return { message: "تم تحديث البيانات بنجاح" };
  }

 // student.service.ts - الرفريش مسموح فقط إذا كان التوكن غير صالح

static async refreshStudentToken(refreshData: RefreshTokenInput) {
  let parsed: RefreshTokenInput;
  try {
    parsed = refreshTokenSchema.parse(refreshData);
  } catch (e) {
    throw badRequest(zodFirstMessage(e));
  }
  
  const { studentId, token: oldToken } = parsed;
  
  const student = await Student.findById(studentId).select(
    "available suspended universityBranch lastTokenRefreshAt lastTokenHash"
  );
  
  if (!student) throw notFound("الطالب غير موجود");
  if (!student.available) throw badRequest("الحساب غير مفعل");
  if (student.suspended) throw badRequest("حسابك مقيد لا يمكنك تحديث التوكن");
  
  try {
    // محاولة التحقق من صحة التوكن
    verifyAccessToken(oldToken);
    
    // إذا وصلنا هنا، يعني التوكن لا يزال صالحاً
    // ممنوع التحديث نهائياً
    throw badRequest("التوكن لا يزال صالحاً. لا يمكنك تحديث التوكن حالياً");
    
  } catch (error) {
    // فقط نتعامل مع انتهاء الصلاحية (التوكن غير صالح)
    if (error instanceof jwt.TokenExpiredError) {
      
      const decoded = jwt.decode(oldToken) as JwtPayload;
      
      if (!decoded || decoded.id !== studentId) {
        throw badRequest("التوكن لا يخص هذا الطالب");
      }
      
      // التوكن غير صالح (منتهي) - مسموح بالتحديث
      const newToken = signAccessToken({ 
        id: student.id, 
        role: "student", 
        university: student.universityBranch 
      });
      
      return {
        token: newToken,
        message: "تم تجديد التوكن بنجاح"
      };
    }
    
    // أخطاء أخرى
    if (error instanceof jwt.JsonWebTokenError) {
      throw badRequest("التوكن غير صالح");
    }
    
    throw error;
  }
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

 static async restrictDeviceRoot(studentId: string) {
  
  // 3. البحث عن الطالب
  const student = await Student.findById(studentId);
  if (!student) throw notFound("الطالب غير موجود");
  
  // 4. التحقق إذا كان الحساب مقيد بالفعل
  if (student.suspended) {
    throw badRequest("الحساب مقيد بالفعل");
  }
  
  // 5. تقييد الحساب
  student.suspended = true;
  student.suspensionReason = `تم اكتشاف أن الجهاز  لديه صلاحيات روت مضرة للبيانات  - تم تقييد الحساب تلقائياً لحماية البيانات`;
  
  await student.save();
  
  return {};
}
}
