import mongoose from "mongoose";
import crypto from "crypto";
import { Payment } from "../models/payment.model";
import { Course } from "../../course/models/course.model";
import { Student } from "../../users/student/models/student.model";
import { Admin } from "../../users/admin/models/admin.model";
import {
  createPaymentSchema,
  generatePaymentCodeSchema,
  updatePaymentSchema,
} from "../schemas/payment.schema";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { sendEmail } from "../../../shared/mailer/sendEmail";
import { paymentHtml } from "../../../shared/mailer/templates";

export class CtrlPaymentService {
  // ~ POST => Generate payment code
  static async generatePaymentCode(data: any, adminId: string) {
    let parsed: any;
    try {
      parsed = generatePaymentCodeSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const admin = await Admin.findById(adminId);
    if (!admin) throw notFound("المسؤول غير موجود");

    const course = await Course.findById(parsed.courseId);
    if (!course) throw notFound("الكورس غير موجود");
    if (course.free) throw badRequest("هذا الكورس مجاني ولا يحتاج إلى دفع");

    const student = await Student.findOne({
      universityNumber: parsed.universityNumber,
    });

    if (!student) throw notFound("الطالب غير موجود");

    const alreadyEnrolled = student.enrolledCourses.some(
      (c) => c.toString() === parsed.courseId,
    );
    if (alreadyEnrolled) throw badRequest("الطالب مسجل بالفعل في هذا الكورس");

    // Generate secure code
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomValues = crypto.randomBytes(12);
    let rawCode = "";
    for (let i = 0; i < 12; i++) {
      rawCode += charset[randomValues[i] % charset.length];
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await sendEmail({
      to: student.email,
      subject: `كود دفع كورس ${course.name}`,
      html: paymentHtml(
        rawCode,
        course.name,
        student.firstName + " " + student.lastName,
        student.universityNumber,
      ),
    });

    const payment = await Payment.create({
      code: rawCode,
      universityNumber: parsed.universityNumber,
      price: parsed.price,
      courseId: parsed.courseId,
      studentId: student._id,
      adminName: admin.firstName + " " + admin.lastName,
      studentNumber: student.phoneNumber,
      expiresAt,
    });

    return {
      message: "تم إنشاء كود الدفع بنجاح",
      code: rawCode,
      expiresAt,
      paymentId: payment._id,
    };
  }

  // ~ POST => Verify & activate payment code
  static async verifyPaymentCode(data: any) {
    const { code, universityNumber, courseId, studentId } = data;

    if (!code) throw badRequest("كود الدفع مطلوب");

    const student = await Student.findById(studentId);
    if (!student) throw notFound("الطالب غير موجود");

    if (student.universityNumber !== universityNumber)
      throw badRequest("الرقم الجامعي غير مطابق");

    const course = await Course.findById(courseId);
    if (!course) throw notFound("الكورس غير موجود");

    const paymentCodes = await Payment.find({
      universityNumber,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!paymentCodes.length) throw badRequest("لا توجد أكواد دفع صالحة");

    let validPayment: any = null;

    for (const p of paymentCodes) {
      const match = await p.compareCode(code);
      if (match) {
        validPayment = p;
        break;
      }
    }

    if (!validPayment) throw badRequest("كود الدفع غير صحيح أو منتهي الصلاحية");

    if (validPayment.courseId.toString() !== courseId)
      throw badRequest("كود الدفع غير صحيح أو منتهي الصلاحية");

    const alreadyEnrolled = student.enrolledCourses.some(
      (c) => c.toString() === courseId,
    );
    if (alreadyEnrolled) throw badRequest("الطالب مسجل بالفعل");

    // Mark payment as used
    validPayment.used = true;
    validPayment.studentId = student._id;
    await validPayment.save();

    // Add course to student
    const studentUpdate = await Student.updateOne(
      { _id: student._id },
      { $addToSet: { enrolledCourses: courseId } },
    );

    if (studentUpdate.modifiedCount === 0) {
      // rollback payment usage
      await Payment.findByIdAndUpdate(validPayment._id, {
        used: false,
        studentId: null,
      });

      throw badRequest("فشل في تسجيل الطالب");
    }

    const courseUpdate = await Course.updateOne(
      { _id: courseId },
      { $addToSet: { students: student._id } },
    );

    if (courseUpdate.modifiedCount === 0) {
      await Payment.findByIdAndUpdate(validPayment._id, {
        used: false,
        studentId: null,
      });

      await Student.updateOne(
        { _id: student._id },
        { $pull: { enrolledCourses: courseId } },
      );

      throw badRequest("فشل في تسجيل الطالب في الكورس");
    }

    return {
      message: "تم تفعيل الكود وتسجيل الكورس بنجاح",
      course: {
        _id: course._id,
        name: course.name,
        image: course.image,
      },
      adminName: validPayment.adminName,
    };
  }

  // ~ GET => All payment codes (admin)
  static async getAllPaymentCodes(query: any) {
    const { courseId } = query;

    const filter: any = {};

    if (courseId) {
      if (!mongoose.isValidObjectId(courseId))
        throw badRequest("معرف الكورس غير صالح");

      filter.courseId = courseId;
    }

    const codes = await Payment.find(filter)
      .populate("courseId", "name image price")
      .populate("studentId", "userName email")
      .sort({ createdAt: -1 })
      .lean();

    return codes;
  }

  // ~ GET => Student payment codes
  static async getStudentPaymentCodes(universityNumber: number) {
    return Payment.find({
      universityNumber,
      expiresAt: { $gt: new Date() },
    })
      .populate("courseId")
      .sort({ createdAt: -1 })
      .lean();
  }
}
