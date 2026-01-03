import mongoose from "mongoose";
import { Question } from "../models/question.model";

import { badRequest, notFound } from "../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../core/http/zodMessage";
import {
  createQuestionSchema,
  updateQuestionSchema,
  answerSchema,
  zodAnswersArraySchema,
} from "../schemas/question.schema";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";
import { Group } from "../../group/models/group.model";

// لو عندك Types مخصصة استعملها، هذا فقط لتسهيل القراءة
type AnyObj = Record<string, any>;

export class QuestionService {
  // ===== helpers =====
  private static assertObjectId(id: string, msg: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest(msg);
  }

  private static ensureHasCorrectAnswer(answers: { correct: boolean }[]) {
    const hasCorrect = answers.some((a) => a.correct);
    if (!hasCorrect)
      throw badRequest("يجب أن تحتوي الإجابات على الأقل على إجابة صحيحة واحدة");
  }

  private static shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ===== CRUD =====

  static async createQuestion(data: AnyObj, file?: ICloudinaryFile) {
    let parsed: any;
    try {
      parsed = createQuestionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const groupId = parsed.groupId as string;
    this.assertObjectId(groupId, "معرف المجموعة غير صالح");

    const group = await Group.findById(groupId);
    if (!group) throw notFound("المجموعة غير موجودة");

    // نفس منطق القديم: إذا mainTitle === null => سؤال واحد فقط
    if (group.mainTitle === null) {
      const count = await Question.countDocuments({ groupId });
      if (count >= 1) throw badRequest("لا يمكن إضافة أكثر من سؤال واحد");
    }

    // شرط إجابة صحيحة واحدة (كان موجود عندك في service القديم)
    this.ensureHasCorrectAnswer(parsed.answers);

    const image = file?.path;

    const created = await Question.create({
      groupId,
      title: parsed.title ?? "",
      subTitle: parsed.subTitle ?? "",
      image: image ?? (parsed.image || ""),
      answers: parsed.answers,
      mark: parsed.mark,
      note: parsed.note ?? "",
      direction: parsed.direction ?? "rtl",
    });

    await created.populate("groupId", "mainTitle");

    return { id: created.id, message: "تم إنشاء السؤال بنجاح" };
  }

  static async getQuestionById(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const question = await Question.findById(id).populate(
      "groupId",
      "mainTitle totalMark"
    );
    if (!question) throw notFound("السؤال غير موجود");

    return question;
  }

  static async getQuestionsByGroupId(groupId: string) {
    this.assertObjectId(groupId, "معرف المجموعة غير صالح");

    const all = await Question.find({ groupId });
    const shuffled = this.shuffleArray([...all]);

    // الكود القديم كان يعمل slice بنفس طول المصفوفة (يعني ما يغير شيء) 😅
    // فهنا نخليه بسيط: نرجّع shuffled مباشرة
    return shuffled;
  }

  static async updateQuestion(id: string, data: AnyObj) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    let parsed: any;
    try {
      parsed = updateQuestionSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    if (parsed.groupId) {
      this.assertObjectId(parsed.groupId, "معرف المجموعة غير صالح");
      const group = await Group.findById(parsed.groupId);
      if (!group) throw notFound("المجموعة غير موجودة");
    }

    // إذا عدلت answers لازم تحقق إجابة صحيحة
    if (parsed.answers) this.ensureHasCorrectAnswer(parsed.answers);

    const question = await Question.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    // تحديث بسيط وواضح
    if (parsed.groupId) question.groupId = parsed.groupId;
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

  static async updateQuestionImage(id: string, file: ICloudinaryFile) {
    this.assertObjectId(id, "معرف السؤال غير صالح");
    if (!file) throw badRequest("صورة السؤال مطلوبة");

    const question = await Question.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.image = file.path;
    await question.save();

    return { message: "تم تحديث صورة السؤال بنجاح" };
  }

  static async deleteQuestion(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) throw notFound("السؤال غير موجود");

    return { message: "تم حذف السؤال بنجاح" };
  }

  static async deleteQuestionsByGroupId(groupId: string) {
    this.assertObjectId(groupId, "معرف المجموعة غير صالح");

    const result = await Question.deleteMany({ groupId });
    return {
      message: "تم حذف جميع أسئلة المجموعة بنجاح",
      deletedCount: result.deletedCount,
    };
  }

  static async deleteQuestionImage(id: string) {
    this.assertObjectId(id, "معرف السؤال غير صالح");

    const question = await Question.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.image = "";
    await question.save();

    return { message: "تم حذف صورة السؤال بنجاح" };
  }

  // ===== New: Answers endpoint =====
  // PATCH /questions/:id/answers
  static async updateAnswers(id: string, data: AnyObj) {
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

    const question = await Question.findById(id);
    if (!question) throw notFound("السؤال غير موجود");

    question.answers = answers;
    await question.save();

    return { message: "تم تحديث الإجابات بنجاح" };
  }
}
