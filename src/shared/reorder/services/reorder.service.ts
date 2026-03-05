import mongoose from "mongoose";
import { badRequest } from "../../../core/errors/httpErrors";
import { Session } from "../../../modules/session/models/session.model";
import { Exam } from "../../../modules/exam/models/exam.model";
import { ReorderItem } from "../types/reorder.type";

export class CtrlReorderService {
  // POST /api/hackit/ctrl/reorder/:courseId
  static async reorderContent(courseId: string, orderedIds: ReorderItem[]) {
    if (!mongoose.isValidObjectId(courseId)) {
      throw badRequest("معرف الكورس غير صالح");
    }

    // فصل العمليات حسب النوع
    const sessionUpdates: any[] = [];
    const examUpdates: any[] = [];

    orderedIds.forEach((item, index) => {
      if (!mongoose.isValidObjectId(item.id)) {
        throw badRequest(`معرف غير صالح للعنصر: ${item.id}`);
      }

      const newNumber = index + 1; // ترقيم جديد 1,2,3,...

      const updateOp = {
        updateOne: {
          filter: { _id: item.id, courseId },
          update: { $set: { number: newNumber } },
        },
      };

      if (item.type === "session") {
        sessionUpdates.push(updateOp);
      } else if (item.type === "exam") {
        examUpdates.push(updateOp);
      } else {
        throw badRequest(`نوع عنصر غير معروف: ${item.type}`);
      }
    });

    // تنفيذ bulkWrite لكل مجموعة
    const [sessionResult, examResult] = await Promise.all([
      sessionUpdates.length > 0
        ? Session.bulkWrite(sessionUpdates)
        : Promise.resolve(),
      examUpdates.length > 0 ? Exam.bulkWrite(examUpdates) : Promise.resolve(),
    ]);

    // التحقق من أن جميع العناصر تم تحديثها (اختياري)
    const totalModified =
      (sessionResult as any)?.modifiedCount ||
      0 + (examResult as any)?.modifiedCount ||
      0;

    if (totalModified !== orderedIds.length) {
      // قد يكون بعض العناصر لا تنتمي لهذا الكورس، نعيد محاولة التحقق
      const existingIds = await Promise.all([
        ...orderedIds
          .filter((item) => item.type === "session")
          .map((item) => Session.exists({ _id: item.id, courseId })),
        ...orderedIds
          .filter((item) => item.type === "exam")
          .map((item) => Exam.exists({ _id: item.id, courseId })),
      ]);

      const foundCount = existingIds.filter(Boolean).length;
      if (foundCount !== orderedIds.length) {
        throw badRequest("بعض العناصر غير موجودة في هذا الكورس");
      }
    }

    return { message: "تم إعادة الترتيب بنجاح" };
  }
}
