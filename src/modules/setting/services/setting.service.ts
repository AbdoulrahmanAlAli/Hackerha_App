import { Course } from "../../course/models/course.model";
import { Payment } from "../../payment/models/payment.model";
import { Student } from "../../users/student/models/student.model";

export class SettingService {
  // ~ Patch => /api/hackit/ctrl/setting/reset-students-relations
  static async resetStudentsRelations() {
    const result = await Student.updateMany(
      {},
      {
        $set: {
          enrolledCourses: [],
          banks: [],
          courses: [],
          sessions: [],
          exams: [],
        },
      }
    );

    return {
      message: "تمت العملية بنجاح",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

    // ~ Get => /api/hackit/ctrl/setting/statistics
    static async getStatistics() {
      // 1. الدخل الكامل من الدورات (مجموع أسعار المدفوعات المستخدمة)
      const totalIncomeResult = await Payment.aggregate([
        { $match: { used: true } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]);
      const totalIncome = totalIncomeResult[0]?.total || 0;

      // 2. عدد الطلاب المسجلين بالتطبيق
      const totalStudents = await Student.countDocuments();

      // 3. عدد الطلاب المسجلين بالدورات (لديهم على الأقل كورس واحد)
      const studentsEnrolled = await Student.countDocuments({
        enrolledCourses: { $exists: true, $not: { $size: 0 } }
      });

      // 4. عدد الدورات المرفوعة
      const totalCourses = await Course.countDocuments();

      return {
        totalIncome,           // الدخل الكامل
        totalStudents,         // عدد الطلاب المسجلين بالتطبيق
        studentsEnrolled,      // عدد الطلاب المسجلين بالدورات
        totalCourses,          // عدد الدورات المرفوعة
      };
    }
}