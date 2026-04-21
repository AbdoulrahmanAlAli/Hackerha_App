import crypto from "crypto";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { Course } from "../../course/models/course.model";
import { Payment } from "../../payment/models/payment.model";
import { Student } from "../../users/student/models/student.model";

export class BotPaymentService {
  static async generateCodeForTelegram(params: {
    courseId: string;
    universityNumber: string;
  }) {
    const { courseId, universityNumber } = params;

    const normalizedUniversityNumber = universityNumber.trim();
    const universityNumberValue = Number(normalizedUniversityNumber);

    if (!normalizedUniversityNumber || Number.isNaN(universityNumberValue)) {
      throw badRequest("الرقم الجامعي غير صالح");
    }

    const student = await Student.findOne({
      universityNumber: universityNumberValue,
    });

    if (!student) throw notFound("الطالب غير موجود");

    const course = await Course.findById(courseId);
    if (!course) throw notFound("الكورس غير موجود");

    if (!course.available) throw badRequest("هذا الكورس غير متاح حالياً");
    if (course.maintenance) {
      throw badRequest("هذا الكورس في وضع الصيانة حالياً");
    }

    const alreadyEnrolled = student.enrolledCourses.some(
      (c: any) => c.toString() === courseId,
    );

    if (alreadyEnrolled) {
      throw badRequest("أنت مسجل بالفعل في هذا الكورس");
    }

    const discountedPrice =
      course.discount?.dis && course.discount?.rate
        ? course.price * (1 - course.discount.rate / 100)
        : course.price;

    const finalPrice = course.free ? 0 : discountedPrice;

    const code = this.generateSecureCode(12);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const payment = await Payment.create({
      code,
      universityNumber: universityNumberValue,
      price: finalPrice,
      courseId: course._id,
      studentId: student._id,
      adminName: "botActiveCourses",
      studentNumber: student.phoneNumber,
      expiresAt,
    });

    return {
      message: "تم إنشاء كود الدفع بنجاح",
      code,
      expiresAt,
      paymentId: payment._id,
      finalPrice,
      courseName: course.name,
      studentName: student.fullName,
      isFree: finalPrice === 0,
    };
  }

  private static generateSecureCode(length: number) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomValues = crypto.randomBytes(length);

    let rawCode = "";
    for (let i = 0; i < length; i++) {
      rawCode += charset[randomValues[i] % charset.length];
    }

    return rawCode;
  }
}