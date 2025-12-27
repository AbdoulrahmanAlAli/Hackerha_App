import mongoose from "mongoose";
import crypto from "crypto";
import {
  PaymentCode,
  validateCreatePaymentCode,
  validateUsePaymentCode,
} from "../../models/payment/paymentCode/PaymentCode.model";
import { Course } from "../../models/courses/Course.model";
import { Student } from "../../models/users/students/Student.model";
import { BadRequestError, NotFoundError } from "../../middlewares/handleErrors";
import { Enrollment } from "../../models/payment/enrollment/Enrollment.model";
import { IAdmin } from "../../models/users/admins/dtos";
import { Admin } from "../../models/users/admins/Admin.model";
import { sendEmail } from "../../utils/mailer";
import { paymentHtml } from "../../utils/mailHtml";

// Define proper types for the service methods
interface GeneratePaymentData {
  universityNumber: number;
  courseId: string;
  studentNumber: string;
  price: string;
}

interface VerifyPaymentData {
  code: string;
  universityNumber: number;
  courseId: string;
  studentId: string;
}

class PaymentService {
  // ~ POST /api/payment/code ~ Generate payment code
  static async generatePaymentCode(
    paymentData: GeneratePaymentData,
    adminId: string
  ) {
    const { error } = validateCreatePaymentCode(paymentData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    // Get admin info to use as adminName
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new NotFoundError("المسؤول غير موجود");
    }

    // Check if course exists and is not free
    const course = await Course.findById(paymentData.courseId);
    if (!course) {
      throw new NotFoundError("الكورس غير موجود");
    }
    if (course.free) {
      throw new BadRequestError("هذا الكورس مجاني ولا يحتاج إلى دفع");
    }

    // Check if student exists with this university number AND student number
    const student = await Student.findOne({
      universityNumber: paymentData.universityNumber,
    });
    if (!student) {
      throw new NotFoundError("الطالب غير موجود أو رقم الطالب غير مطابق");
    }

    // Check if student is already enrolled
    const isEnrolled = student.enrolledCourses.some(
      (enrolledCourseId) => enrolledCourseId.toString() === paymentData.courseId
    );
    if (isEnrolled) {
      throw new BadRequestError("الطالب مسجل بالفعل في هذا الكورس");
    }

    // Generate secure random alphanumeric code (12 characters)
    const generateSecureCode = (length: number): string => {
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const randomValues = crypto.randomBytes(length);
      let result = "";

      for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
      }

      return result;
    };

    const rawCode = generateSecureCode(12);

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
      await sendEmail({
        to: student.email,
        subject: `كود دفع كورس ${course.name}`,
        html: paymentHtml(
          rawCode,
          course.name,
          student.firstName + " " + student.lastName,
          student.universityNumber
        ),
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      throw new Error("فشل في إرسال بريد التحقق، يرجى المحاولة مرة أخرى");
    }

    // Create payment code
    const paymentCode = await PaymentCode.create({
      code: rawCode,
      universityNumber: paymentData.universityNumber,
      courseId: paymentData.courseId,
      price: paymentData.price,
      studentId: student._id,
      adminName: admin.firstName + " " + admin.lastName, // Use admin's userName as adminName
      studentNumber: student.phoneNumber,
      expiresAt,
    });

    return {
      message: "تم إنشاء كود الدفع بنجاح",
      code: rawCode, // Return the raw code only once
      expiresAt,
      paymentCodeId: paymentCode._id,
      adminName: admin.firstName + " " + admin.lastName,
      studentNumber: paymentData.studentNumber,
      studentName: student.firstName + " " + student.lastName,
    };
  }

  // ~ POST /api/payment/verify ~ Verify and use payment code
  static async verifyPaymentCode(verificationData: VerifyPaymentData) {
    const { error } = validateUsePaymentCode(verificationData);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    // Check if student exists
    const student = await Student.findById(verificationData.studentId);
    if (!student) {
      throw new NotFoundError("الطالب غير موجود");
    }

    // Verify university number matches
    if (student.universityNumber !== verificationData.universityNumber) {
      throw new BadRequestError("الرقم الجامعي غير مطابق");
    }

    // Check if the requested course exists
    const requestedCourse = await Course.findById(verificationData.courseId);
    if (!requestedCourse) {
      throw new NotFoundError("الكورس المطلوب غير موجود");
    }

    // Find valid payment codes for this university number
    const paymentCodes = await PaymentCode.find({
      universityNumber: verificationData.universityNumber,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (paymentCodes.length === 0) {
      throw new NotFoundError("لا توجد أكواد دفع صالحة");
    }

    // Check each code to find the matching one using compareCode method
    let validPaymentCode: any = null;
    for (const code of paymentCodes) {
      const isMatch = await code.compareCode(verificationData.code);
      if (isMatch) {
        validPaymentCode = code;
        break;
      }
    }

    if (!validPaymentCode) {
      throw new BadRequestError("كود الدفع غير صحيح أو منتهي الصلاحية");
    }

    // Check if the payment code is for the same course
    if (validPaymentCode.courseId.toString() !== verificationData.courseId) {
      throw new BadRequestError("كود الدفع غير صحيح أو منتهي الصلاحية");
    }

    // Check if already enrolled
    const isEnrolled = student.enrolledCourses.some(
      (enrolledCourseId) =>
        enrolledCourseId.toString() === verificationData.courseId
    );
    if (isEnrolled) {
      throw new BadRequestError("الطالب مسجل بالفعل في هذا الكورس");
    }

    try {
      // Mark payment code as used
      validPaymentCode.used = true;
      validPaymentCode.studentId = student._id;
      await validPaymentCode.save();

      // Create enrollment
      await Enrollment.create({
        studentId: student._id,
        courseId: verificationData.courseId,
        paymentCode: verificationData.code,
        enrolledAt: new Date(),
        adminName: validPaymentCode.adminName,
      });

      // Add course to student's enrolled courses
      await Student.findByIdAndUpdate(student._id, {
        $addToSet: { enrolledCourses: verificationData.courseId },
      });

      // Add student to course's students list
      await Course.findByIdAndUpdate(verificationData.courseId, {
        $addToSet: { students: student._id },
      });

      return {
        message: "تم تفعيل الكود وتسجيل الكورس بنجاح",
        course: {
          _id: requestedCourse._id,
          name: requestedCourse.name,
          image: requestedCourse.image,
        },
        adminName: validPaymentCode.adminName,
      };
    } catch (error) {
      // If any operation fails, revert the payment code usage
      await PaymentCode.findByIdAndUpdate(validPaymentCode._id, {
        used: false,
        studentId: null,
      });
      throw new BadRequestError("فشل في عملية التسجيل، يرجى المحاولة مرة أخرى");
    }
  }

  // ~ GET /api/payment/codes ~ Get all payment codes
  static async getAllPaymentCodes() {
    const paymentCodes = await PaymentCode.find()
      .populate("courseId")
      .populate("studentId")
      .select(
        "code universityNumber used expiresAt courseId studentId adminName studentNumber createdAt price"
      )
      .sort({ createdAt: -1 });

    return {
      paymentCodes,
    };
  }

  // ~ GET /api/payment/codes/:universityNumber ~ Get payment codes for student
  static async getStudentPaymentCodes(universityNumber: number) {
    const paymentCodes = await PaymentCode.find({
      universityNumber,
      expiresAt: { $gt: new Date() },
    })
      .populate("courseId", "name image price")
      .select("code used expiresAt courseId adminName studentNumber createdAt")
      .sort({ createdAt: -1 });

    return {
      paymentCodes: paymentCodes.map((code) => ({
        _id: code._id,
        course: code.courseId,
        used: code.used,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt,
      })),
    };
  }

  // ~ GET /api/payment/enrollments/:studentId ~ Get student enrollments
  static async getStudentEnrollments(studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new BadRequestError("معرف الطالب غير صالح");
    }

    const enrollments = await Enrollment.find({ studentId })
      .populate("courseId", "name image description price rating")
      .sort({ enrolledAt: -1 });

    return { enrollments };
  }

  // ~ GET /api/payment/codes/admin/:adminName ~ Get payment codes by admin
  static async getPaymentCodesByAdmin(adminName: string) {
    const paymentCodes = await PaymentCode.find({ adminName })
      .populate("courseId", "name image price")
      .populate("studentId", "userName email phoneNumber")
      .select(
        "code universityNumber used expiresAt courseId studentId studentNumber createdAt"
      )
      .sort({ createdAt: -1 });

    return {
      adminName,
      paymentCodes: paymentCodes.map((code) => ({
        _id: code._id,
        code: code.code,
        universityNumber: code.universityNumber,
        course: code.courseId,
        student: code.studentId,
        used: code.used,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt,
      })),
      totalCodes: paymentCodes.length,
      usedCodes: paymentCodes.filter((code) => code.used).length,
      activeCodes: paymentCodes.filter(
        (code) => !code.used && code.expiresAt > new Date()
      ).length,
    };
  }
}

export { PaymentService };
