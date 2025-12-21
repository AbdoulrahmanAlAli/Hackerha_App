import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../../middlewares/handleErrors";
import { Course } from "../../../models/courses/Course.model";
import { IExam } from "../../../models/courses/exam/dtos";
import {
  Exam,
  validateCreateExam,
  validateUpdateExam,
} from "../../../models/courses/exam/Exam.model";
import { Session } from "../../../models/courses/session/Session.model";

class ExamService {
  // Create new exam
  static async createExam(examData: IExam) {
    const { error } = validateCreateExam(examData);
    if (error) throw new BadRequestError(error.details[0].message);

    // Verify course exists
    const course = await Course.findById(examData.courseId);
    if (!course) throw new NotFoundError("الكورس غير موجود");

    const examWithSameNumber = await Exam.findOne({
      courseId: examData.courseId,
      number: examData.number,
    });
    if (examWithSameNumber) {
      throw new BadRequestError("الرقم موجود بالفعل 1");
    }

    const sessionWithSameNumber = await Session.findOne({
      courseId: examData.courseId,
      number: examData.number,
    });
    if (sessionWithSameNumber) {
      throw new BadRequestError("الرقم موجود بالفعل 2");
    }

    const exam = await Exam.create(examData);

    if (!exam) throw new NotFoundError("فشل إنشاء الاختبار");

    return { id: exam.id, message: "تم إنشاء الامتحان بنجاح" };
  }

  // Get exam by ID
  static async getExamById(id: string) {
    const exam = await Exam.findById(id).populate("courseId", "name");
    if (!exam) throw new NotFoundError("الاختبار غير موجود");
    return exam;
  }

  // Get exams by course ID
  static async getExamsByCourseId(courseId: string) {
    const exams = await Exam.find({ courseId })
      .sort({ createdAt: -1 })
      .populate("courseId", "name");
    return exams;
  }

  // Update exam
  static async updateExam(examId: string, updateData: IExam) {
    const { error } = validateUpdateExam(updateData);
    if (error) throw new BadRequestError(error.details[0].message);

    const examHave = await Exam.findById(examId);
    if (!examHave) {
      throw new NotFoundError("الاختبار غير موجود");
    }

    if (
      updateData.number !== undefined &&
      updateData.number !== examHave.number
    ) {
      const courseId = updateData.courseId || examHave.courseId;

      // التحقق من أن الرقم غير مستخدم في امتحان آخر لنفس الكورس
      const existingExamWithSameNumber = await Exam.findOne({
        courseId: courseId,
        number: updateData.number,
        _id: { $ne: examId }, // استبعاد الامتحان الحالي
      });

      if (existingExamWithSameNumber) {
        throw new BadRequestError("الرقم مستخدم بالفعل في امتحان آخر");
      }

      // التحقق من أن الرقم غير مستخدم في جلسة لنفس الكورس
      const existingSessionWithSameNumber = await Session.findOne({
        courseId: courseId,
        number: updateData.number,
      });

      if (existingSessionWithSameNumber) {
        throw new BadRequestError("الرقم مستخدم بالفعل في جلسة");
      }
    }

    const exam = await Exam.findByIdAndUpdate(examId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!exam) throw new NotFoundError("فشل تحديث الاختبار");

    return { message: "تم تحديث الامتحان بنجاح" };
  }

  // Delete exam
  static async deleteExam(examId: string) {
    const exam = await Exam.findByIdAndDelete(examId);
    if (!exam) throw new NotFoundError("الاختبار غير موجود");
    return { message: "تم حذف الاختبار بنجاح" };
  }
}

export { ExamService };
