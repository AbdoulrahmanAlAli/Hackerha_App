import mongoose from "mongoose";
import { SingleQuestion } from "../models/question.model";

import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import {
  createSingleQuestionSchema,
  updateSingleQuestionSchema,
  answerSchema,
  zodAnswersArraySchema,
} from "../schemas/question.schema";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";
import { ISingleQuestion } from "../types/question.types";
import { Exam } from "../../models/exam.model";

export class SingleQuestionService {
  // ===== helpers =====
  private static assertObjectId(id: string, msg: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest(msg);
  }

  private static ensureHasCorrectAnswer(answers: { correct: boolean }[]) {
    const hasCorrect = answers.some((a) => a.correct);
    if (!hasCorrect)
      throw badRequest("يجب أن تحتوي الإجابات على الأقل على إجابة صحيحة واحدة");
  }

  // ===== CRUD =====
  static async createSingleQuestion(data: ISingleQuestion, file?: ICloudinaryFile) {
    let parsed: any;
    try {
      parsed = createSingleQuestionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const examId = parsed.examId as string;
    this.assertObjectId(examId, "معرف الامتحان غير صالح");

    const exam = await Exam.findById(examId);
    if (!exam) throw notFound("الامتحان غير موجود");

    // شرط إجابة صحيحة واحدة
    this.ensureHasCorrectAnswer(parsed.answers);

     // التحقق من مجموع علامات الأسئلة
    const allQuestions = await SingleQuestion.find({ examId: exam.id });
    const currentTotalMarks = allQuestions.reduce((sum, q) => sum + q.mark, 0);
    const newTotalMarks = currentTotalMarks + parsed.mark;
    
    if (newTotalMarks > exam.totalMark) {
      const remaining = exam.totalMark - currentTotalMarks;
      throw badRequest(
        `لا يمكن إضافة السؤال. المتبقي من العلامات هو ${remaining} من أصل ${exam.totalMark}`
      );
    }
    
    // جلب أكبر رقم سؤال في هذا الامتحان
    const lastQuestion = await SingleQuestion.findOne({ examId: exam.id })
      .sort({ number: -1 })
      .select('number');
    
    const maxNumber = lastQuestion?.number || 0;
    const newNumber = maxNumber + 1;

    const image = file?.path;

    const created = await SingleQuestion.create({
      examId,
      title: parsed.title ?? "",
      subTitle: parsed.subTitle ?? "",
      image: image ?? (parsed.image || ""),
      answers: parsed.answers,
      mark: parsed.mark,
      note: parsed.note ?? "",
      direction: parsed.direction ?? "rtl",
      number: newNumber, // ✅ يتم إضافة الرقم تلقائياً
    });

    console.log(created)
    await created.populate("examId", "mainTitle");

    return { id: created.id, message: "تم إنشاء السؤال بنجاح" };
  }

  static async getSingleQuestionById(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const question = await SingleQuestion.findById(id).populate(
      "examId",
      "mainTitle totalMark"
    );
    if (!question) throw notFound("السؤال غير موجود");

    return question;
  }

  static async getSingleQuestionsByExamId(examId: string) {
    this.assertObjectId(examId, "معرف المجموعة غير صالح");

    const all = await SingleQuestion.find({ examId }).sort({ number: 1, createdAt: 1 });;

    return all;
  }

  static async updateSingleQuestion(id: string, data: ISingleQuestion) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    let parsed: any;
    try {
      parsed = updateSingleQuestionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    if (parsed.examId) {
      this.assertObjectId(parsed.examId, "معرف السؤال غير صالح");
      const exam = await Exam.findById(parsed.examId);
      if (!exam) throw notFound("السؤال غير موجودة");
    }

    // إذا عدلت answers لازم تحقق إجابة صحيحة
    if (parsed.answers) this.ensureHasCorrectAnswer(parsed.answers);

    const question = await SingleQuestion.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    // تحديث بسيط وواضح
    if (parsed.examId) question.examId = parsed.examId;
    if (parsed.title !== undefined) question.title = parsed.title;
    if (parsed.subTitle !== undefined) question.subTitle = parsed.subTitle;
    if (parsed.image !== undefined) question.image = parsed.image;
    if (parsed.answers !== undefined) question.answers = parsed.answers;
    if (parsed.mark !== undefined) question.mark = parsed.mark;
    if (parsed.note !== undefined) question.note = parsed.note;
    if (parsed.direction !== undefined) question.direction = parsed.direction;

    await question.save();
    return { message: "تم تحديث السؤال بنجاح" };
  }

  static async updateSingleQuestionImage(id: string, file: ICloudinaryFile) {
    this.assertObjectId(id, "معرف السؤال غير صالح");
    if (!file) throw badRequest("صورة السؤال مطلوبة");

    const question = await SingleQuestion.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.image = file.path;
    await question.save();

    return { message: "تم تحديث صورة السؤال بنجاح" };
  }

  static async deleteSingleQuestion(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const deleted = await SingleQuestion.findByIdAndDelete(id);
    if (!deleted) throw notFound("السؤال غير موجود");

    return { message: "تم حذف السؤال بنجاح" };
  }

  static async deleteSingleQuestionsByexamId(examId: string) {
    this.assertObjectId(examId, "معرف المجموعة غير صالح");

    const result = await SingleQuestion.deleteMany({ examId });
    return {
      message: "تم حذف جميع أسئلة المجموعة بنجاح",
      deletedCount: result.deletedCount,
    };
  }

  static async deleteSingleQuestionImage(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const question = await SingleQuestion.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.image = "";
    await question.save();

    return { message: "تم حذف صورة السؤال بنجاح" };
  }

 static async deleteMultipleQuestions(ids: string[]) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw badRequest("يجب توفير مصفوفة من معرفات الأسئلة");
  }

  // تنظيف الـ IDs من أي مسافات أو أحرف خاصة
  const cleanIds = ids.map(id => id.trim());
  
  // التحقق من صحة كل ID
  for (const id of cleanIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw badRequest(`معرف السؤال غير صالح: ${id}`);
    }
  }

  const result = await SingleQuestion.deleteMany({ 
    _id: { $in: cleanIds } 
  });

  if (result.deletedCount === 0) {
    throw notFound("لم يتم العثور على الأسئلة المحددة");
  }

  return { 
    message: "تم حذف الأسئلة بنجاح", 
    deletedCount: result.deletedCount,
    totalRequested: cleanIds.length
  };
}


  // PATCH /SingleQuestions/:id/answers
  static async updateAnswers(id: string, data: ISingleQuestion) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const rawAnswers = data?.answers;
    if (!rawAnswers) throw badRequest("الإجابات مطلوبة");

    let answers: any;
    try {
      answers = zodAnswersArraySchema.parse(rawAnswers);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    this.ensureHasCorrectAnswer(answers);

    const question = await SingleQuestion.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.answers = answers;
    await question.save();

    return { message: "تم تحديث الإجابات بنجاح" };
  }

  static async reorderQuestionsByArray(examId: string, questionIds: string[]) {
     // التحقق من وجود questionIds
    if (!questionIds || !Array.isArray(questionIds)) {
      throw badRequest("يجب توفير مصفوفة من معرفات الأسئلة");
    }

    // تحقق من صحة الـ examId
    this.assertObjectId(examId, "معرف الامتحان غير صالح");
    
    // تحقق من وجود الامتحان
    const exam = await Exam.findById(examId);
    if (!exam) throw notFound("الامتحان غير موجود");
    
    // تحقق من صحة الـ IDs
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      throw badRequest("يجب توفير مصفوفة من معرفات الأسئلة");
    }
    
    // تحقق من صحة كل ID
    for (const id of questionIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw badRequest(`معرف السؤال غير صالح: ${id}`);
      }
    }
    
    // تحقق من أن جميع الأسئلة موجودة وتتبع نفس الامتحان
    const questions = await SingleQuestion.find({
      _id: { $in: questionIds },
      examId: examId
    });
    
    if (questions.length !== questionIds.length) {
      throw badRequest("بعض الأسئلة غير موجودة أو لا تتبع هذا الامتحان");
    }
    
    // تحديث الأرقام حسب موقع ID في المصفوفة
    const updatePromises = questionIds.map((id, index) => 
      SingleQuestion.findByIdAndUpdate(id, { number: index + 1 }) // الأرقام تبدأ من 1
    );
    
    await Promise.all(updatePromises);
    
    return { 
      message: "تم إعادة ترتيب الأسئلة بنجاح",
      updatedCount: questionIds.length
    };
  }
}
