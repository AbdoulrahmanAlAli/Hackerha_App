import mongoose from "mongoose";
import { Session } from "../../modules/session/models/session.model";
import { Exam } from "../../modules/exam/models/exam.model";

export async function removeUniqueIndexFromSessionsAndExams() {
  try {
    // جلب جميع الفهارس للمجموعة sessions
    const sessionIndexes = await Session.collection.indexes();
    const examIndexes = await Exam.collection.indexes();

    // البحث عن الفهرس الذي نريد إزالته (عادةً اسمه "courseId_1_number_1")
    const sessionIndexToDrop = sessionIndexes.find(
      (idx) =>
        idx.key &&
        idx.key.courseId === 1 &&
        idx.key.number === 1 &&
        idx.unique === true,
    );

    const examIndexToDrop = examIndexes.find(
      (idx) =>
        idx.key &&
        idx.key.courseId === 1 &&
        idx.key.number === 1 &&
        idx.unique === true,
    );

    // التأكد من وجود الاسم قبل الإسقاط
    if (sessionIndexToDrop && sessionIndexToDrop.name) {
      await Session.collection.dropIndex(sessionIndexToDrop.name);
      console.log("✅ تم إسقاط الفهرس الفريد لـ sessions");
    } else {
      console.log(
        "ℹ️ لم يتم العثور على الفهرس الفريد لـ sessions أو لا يوجد اسم",
      );
    }

    if (examIndexToDrop && examIndexToDrop.name) {
      await Exam.collection.dropIndex(examIndexToDrop.name);
      console.log("✅ تم إسقاط الفهرس الفريد لـ exams");
    } else {
      console.log("ℹ️ لم يتم العثور على الفهرس الفريد لـ exams أو لا يوجد اسم");
    }

    // إنشاء فهارس جديدة بدون unique
    await Session.collection.createIndex(
      { courseId: 1, number: 1 },
      { background: true },
    );
    await Exam.collection.createIndex(
      { courseId: 1, number: 1 },
      { background: true },
    );
    console.log("✅ تم إنشاء الفهارس الجديدة بدون unique");
  } catch (error) {
    console.error("❌ خطأ أثناء تعديل الفهارس:", error);
  }
}
