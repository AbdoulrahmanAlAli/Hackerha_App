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

    if (updateData.number) {
      const examWithSameNumber = await Exam.findOne({
        courseId: updateData.courseId,
        number: updateData.number,
      });
      if (!examWithSameNumber) {
        throw new BadRequestError("الرقم موجود بالفعل");
      }

      const sessionWithSameNumber = await Session.findOne({
        courseId: updateData.courseId,
        number: updateData.number,
      });
      if (!sessionWithSameNumber) {
        throw new BadRequestError("الرقم موجود بالفعل");
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
