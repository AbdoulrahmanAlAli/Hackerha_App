import mongoose from "mongoose";
import { SingleQuestionBank } from "../models/question.model";
import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import {
  createSingleQuestionSchemaBank,
  updateSingleQuestionSchemaBank,
  zodAnswersArraySchema,
} from "../schemas/question.schema";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";
import { ISingleQuestionBank } from "../types/question.types";
import { BankExam } from "../../models/bank-exam.model";

export class SingleQuestionService {
  // ===== helpers =====
  private static assertObjectId(id: string, msg: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest(msg);
  }

  private static ensureHasCorrectAnswer(answers: { correct: boolean }[]) {
    const correctCount = answers.filter((a) => a.correct).length;
    if (correctCount !== 1)
      throw badRequest("يجب أن تحتوي الإجابات على إجابة صحيحة واحدة فقط");
  }

  // ===== CRUD =====
  static async createSingleQuestion(data: ISingleQuestionBank, file?: ICloudinaryFile) {
    let parsed: any;
    try {
      parsed = createSingleQuestionSchemaBank.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const bankExamId = parsed.bankExamId as string;
    this.assertObjectId(bankExamId, "معرف امتحان البنك غير صالح");

    const bankExam = await BankExam.findById(bankExamId);
    if (!bankExam) throw notFound("امتحان البنك غير موجود");

    // التحقق من مجموع علامات الأسئلة في امتحان البنك
    const allQuestions = await SingleQuestionBank.find({ bankExamId: bankExam.id });
    const currentTotalMarks = allQuestions.reduce((sum, q) => sum + q.mark, 0);
    const newTotalMarks = currentTotalMarks + parsed.mark;
    
    if (newTotalMarks > bankExam.totalMark) {
      const remaining = bankExam.totalMark - currentTotalMarks;
      throw badRequest(
        `لا يمكن إضافة السؤال. المتبقي من العلامات هو ${remaining} من أصل ${bankExam.totalMark}`
      );
    }

    // جلب أكبر رقم سؤال في هذا الامتحان
    const lastQuestion = await SingleQuestionBank.findOne({ bankExamId: bankExam.id })
      .sort({ number: -1 })
      .select('number');
    
    const maxNumber = lastQuestion?.number || 0;
    const newNumber = maxNumber + 1;

    // معالجة الصورة
    let image = "";
      if (file) {
        image = file.path;
      } else if (parsed.image !== undefined) {
        image = parsed.image;
      } else {
        image = "";
      }

    const created = await SingleQuestionBank.create({
      bankExamId,
      title: parsed.title ?? "",
      subTitle: parsed.subTitle ?? "",
      image: image,
      answers: parsed.answers,
      mark: parsed.mark,
      note: parsed.note ?? "",
      direction: parsed.direction ?? "rtl",
      number: newNumber,
    });

    await created.populate("bankExamId", "title");

    return { id: created.id, message: "تم إنشاء السؤال بنجاح" };
  }

  static async getSingleQuestionById(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const question = await SingleQuestionBank.findById(id).populate(
      "bankExamId",
      "title totalMark"
    );
    if (!question) throw notFound("السؤال غير موجود");

    return question;
  }

  static async getSingleQuestionsByBankExamId(bankExamId: string) {  // تغيير الاسم
    this.assertObjectId(bankExamId, "معرف امتحان البنك غير صالح");

    const all = await SingleQuestionBank.find({ bankExamId }).sort({ number: 1, createdAt: 1 });

    return all;
  }

  static async updateSingleQuestion(id: string, data: ISingleQuestionBank, file?: ICloudinaryFile) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    let parsed: any;
    try {
      parsed = updateSingleQuestionSchemaBank.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    if (parsed.bankExamId) {
      this.assertObjectId(parsed.bankExamId, "معرف امتحان البنك غير صالح");
      const bankExam = await BankExam.findById(parsed.bankExamId);
      if (!bankExam) throw notFound("امتحان البنك غير موجود");
    }

    // إذا عدلت answers لازم تحقق إجابة صحيحة
    if (parsed.answers) this.ensureHasCorrectAnswer(parsed.answers);

    const question = await SingleQuestionBank.findById(id);
    if (!question) throw notFound("السؤال غير موجود");
    console.log({file: file, path: file?.path, parseBodyImage: parsed.image});

    // تحديث البيانات
    if (parsed.bankExamId) question.bankExamId = parsed.bankExamId;
    if (parsed.title !== undefined) question.title = parsed.title;
    if (parsed.subTitle !== undefined) question.subTitle = parsed.subTitle;
    
    // معالجة الصورة:
    // 1. إذا تم رفع ملف جديد، استبدل الصورة القديمة
    // 2. إذا تم إرسال image في الـ body (حتى لو كان فارغًا)، حدّث القيمة
    // 3. إذا لم يتم إرسال حقل image، اترك الصورة كما هي
    if (file) {
      question.image = file.path;
    } else if (file === undefined) {
      question.image = question.image;
    }
    
    if (parsed.answers !== undefined) question.answers = parsed.answers;
    if (parsed.mark !== undefined) question.mark = parsed.mark;
    if (parsed.note !== undefined) question.note = parsed.note;
    if (parsed.direction !== undefined) question.direction = parsed.direction;

    await question.save();
    return { message: "تم تحديث السؤال بنجاح" };
  }

  static async deleteSingleQuestion(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const deleted = await SingleQuestionBank.findByIdAndDelete(id);
    if (!deleted) throw notFound("السؤال غير موجود");

    return { message: "تم حذف السؤال بنجاح" };
  }

  static async deleteSingleQuestionsByBankExamId(bankExamId: string) {  // تغيير الاسم
    this.assertObjectId(bankExamId, "معرف امتحان البنك غير صالح");

    const result = await SingleQuestionBank.deleteMany({ bankExamId });
    return {
      message: "تم حذف جميع أسئلة امتحان البنك بنجاح",
      deletedCount: result.deletedCount,
    };
  }

  static async deleteSingleQuestionImage(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const question = await SingleQuestionBank.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.image = "";
    await question.save();

    return { message: "تم حذف صورة السؤال بنجاح" };
  }

  static async deleteMultipleQuestions(ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw badRequest("يجب توفير مصفوفة من معرفات الأسئلة");
    }

    const cleanIds = ids.map(id => id.trim());
    
    for (const id of cleanIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw badRequest(`معرف السؤال غير صالح: ${id}`);
      }
    }

    const result = await SingleQuestionBank.deleteMany({ 
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
  static async updateAnswers(id: string, data: ISingleQuestionBank) {
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

    const question = await SingleQuestionBank.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.answers = answers;
    await question.save();

    return { message: "تم تحديث الإجابات بنجاح" };
  }

  static async reorderQuestionsByArray(bankExamId: string, questionIds: string[]) {  // تغيير المعامل
    if (!questionIds || !Array.isArray(questionIds)) {
      throw badRequest("يجب توفير مصفوفة من معرفات الأسئلة");
    }

    this.assertObjectId(bankExamId, "معرف امتحان البنك غير صالح");
    
    const bankExam = await BankExam.findById(bankExamId);
    if (!bankExam) throw notFound("امتحان البنك غير موجود");
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      throw badRequest("يجب توفير مصفوفة من معرفات الأسئلة");
    }
    
    for (const id of questionIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw badRequest(`معرف السؤال غير صالح: ${id}`);
      }
    }
    
    const questions = await SingleQuestionBank.find({
      _id: { $in: questionIds },
      bankExamId: bankExamId
    });
    
    if (questions.length !== questionIds.length) {
      throw badRequest("بعض الأسئلة غير موجودة أو لا تتبع هذا الامتحان");
    }
    
    const updatePromises = questionIds.map((id, index) => 
      SingleQuestionBank.findByIdAndUpdate(id, { number: index + 1 })
    );
    
    await Promise.all(updatePromises);
    
    return { 
      message: "تم إعادة ترتيب الأسئلة بنجاح",
      updatedCount: questionIds.length
    };
  }
}