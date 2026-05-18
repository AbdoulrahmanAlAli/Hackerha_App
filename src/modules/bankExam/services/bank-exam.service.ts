import mongoose from "mongoose";
import { BankExam } from "../models/bank-exam.model";
import { Bank } from "../../bank/models/bank.model";
import {
  createBankExamSchema,
  updateBankExamSchema,
  CreateBankExamInput,
  UpdateBankExamInput,
} from "../schemas/bank-exam.schema";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { SingleQuestionBank } from "../single-question/models/question.model";

export class BankExamService {
  static async createBankExam(data: CreateBankExamInput) {
    let parsed: CreateBankExamInput;
    try {
      parsed = createBankExamSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const bank = await Bank.findById(data.bankId);
    if (!bank) throw notFound("البنك غير موجود");

    // حساب الرقم التلقائي للامتحان داخل البنك
    const lastBankExam = await BankExam.findOne({ bankId: data.bankId }).sort({ number: -1 });
    const newNumber = (lastBankExam?.number || 0) + 1;

    const bankExam = await BankExam.create({
      ...parsed,  // استخدام parsed بدلاً من data لضمان التحقق من الصحة
      number: newNumber,
    });

    return { id: bankExam.id, message: "تم إنشاء امتحان البنك بنجاح" };
  }

  static async getBankExamById(id: string) {
    if (!mongoose.isValidObjectId(id)) throw badRequest("معرف غير صالح");

    const bankExam = await BankExam.findById(id).populate("bankId", "title");
    if (!bankExam) throw notFound("امتحان البنك غير موجود");

    return bankExam;
  }

  static async getBankExamsByBankId(bankId: string, userRole: string) {
    if (!mongoose.isValidObjectId(bankId)) throw badRequest("معرف غير صالح");

    const bank = await Bank.findById(bankId).select("_id");
    if (!bank) throw notFound("البنك غير موجود");

    let query: any = { bankId };
  
    if (userRole === 'student') {
      query.available = true;
    }

    const bankExams = await BankExam.find(query)
      .sort({ number: 1 })
      .populate("bankId", "title");

    return bankExams;
  }

  static async updateBankExam(examId: string, data: UpdateBankExamInput) {
    if (!mongoose.isValidObjectId(examId)) throw badRequest("معرف غير صالح");

    let parsed: UpdateBankExamInput;
    try {
      parsed = updateBankExamSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const bankExam = await BankExam.findById(examId);
    if (!bankExam) throw notFound("امتحان البنك غير موجود");

    const updated = await BankExam.findByIdAndUpdate(examId, parsed, {
      new: true,
      runValidators: true,
    }).select("-__v");
    
    if (!updated) throw notFound("فشل تحديث امتحان البنك");

    return { message: "تم تحديث امتحان البنك بنجاح" };
  }

  static async deleteBankExam(examId: string) {
    if (!mongoose.isValidObjectId(examId)) {
      throw badRequest("معرف غير صالح");
    }

    const bankExam = await BankExam.findById(examId).select("_id");
    if (!bankExam) {
      throw notFound("امتحان البنك غير موجود");
    }

    // حذف الأسئلة المرتبطة بهذا الامتحان
    await SingleQuestionBank.deleteMany({ bankExamId: bankExam._id });

    // حذف الامتحان نفسه
    await BankExam.findByIdAndDelete(examId);

    return {
      message: "تم حذف امتحان البنك مع جميع الأسئلة المرتبطة بنجاح",
    };
  }
}