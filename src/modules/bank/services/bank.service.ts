import mongoose from "mongoose";
import { Bank } from "../models/bank.model";
import {
  createBankSchema,
  updateBankSchema,
  CreateBankInput,
  UpdateBankInput,
} from "../schemas/bank.schema";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { IBankExam } from "../../bankExam/types/bank-exam.types";
import { BankExam } from "../../bankExam/models/bank-exam.model";
import { SingleQuestionBank } from "../../bankExam/single-question/models/question.model";

export class BankService {
  // إنشاء بنك جديد
  static async createBank(data: CreateBankInput) {
    let parsed: CreateBankInput;

    try {
      parsed = createBankSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const bank = await Bank.create({
      ...parsed,
      available: false,
    });

    return {
      id: bank.id,
      message: "تم إنشاء البنك بنجاح",
    };
  }

  // جلب بنك واحد بواسطة id مع الإحصائيات
  static async getBankById(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw badRequest("معرف غير صالح");
    }

    const bank = await Bank.findById(id);

    if (!bank) {
      throw notFound("البنك غير موجود");
    }

    // جلب إحصائيات الامتحانات والأسئلة
    const bankExams: IBankExam[] = await BankExam.find({ bankId: bank._id });
    
    // عدد الامتحانات
    const bankExamsCount = bankExams.length;
    
    // إجمالي عدد الأسئلة في كل امتحانات البنك
    let totalQuestionsCount = 0;
    for (const exam of bankExams) {
      const questionsCount = await SingleQuestionBank.countDocuments({ bankExamId: exam._id });
      totalQuestionsCount += questionsCount;
    }

    // تحويل البنك إلى كائن عادي وإضافة الإحصائيات
    const bankObject = bank.toObject();
    
    return {
      ...bankObject,
      bankExamsCount,
      totalQuestionsCount,
      bankExams,
    };
  }

  // جلب كل البنوك مع الإحصائيات
  static async getAllBanks(filters?: { year?: string; semester?: string }) {
    // بناء query للتصفية
    let query: any = {};
    if (filters?.year) query.year = filters.year;
    if (filters?.semester) query.semester = filters.semester;

    // جلب البنوك مع الترتيب
    const banks = await Bank.find(query).sort({ createdAt: -1 });

    // جلب الإحصائيات لكل بنك
    const banksWithStats = await Promise.all(
      banks.map(async (bank) => {
        // جلب امتحانات هذا البنك
        const bankExams: IBankExam[] = await BankExam.find({ bankId: bank._id });
        
        // عدد الامتحانات
        const bankExamsCount = bankExams.length;
        
        // إجمالي عدد الأسئلة في كل امتحانات البنك
        let totalQuestionsCount = 0;
        for (const exam of bankExams) {
          const questionsCount = await SingleQuestionBank.countDocuments({ bankExamId: exam._id });
          totalQuestionsCount += questionsCount;
        }
        
        const bankObject = bank.toObject();
        
        return {
          ...bankObject,
          bankExamsCount,
          totalQuestionsCount,
        };
      })
    );

    // إضافة إحصائيات عامة
    const totalBanks = banksWithStats.length;
    const totalExams = banksWithStats.reduce((sum: number, bank) => sum + bank.bankExamsCount, 0);
    const totalQuestions = banksWithStats.reduce((sum: number, bank) => sum + bank.totalQuestionsCount, 0);
    const availableBanks = banksWithStats.filter(bank => bank.available).length;

    return {
      banks: banksWithStats,
      summary: {
        totalBanks,
        totalExams,
        totalQuestions,
        availableBanks,
      },
    };
  }

  // جلب البنوك مع فلتر السنة والفصل
  static async getBanksByYearAndSemester(year: string, semester: string) {
    if (!year || !semester) {
      throw badRequest("السنة والفصل مطلوبان");
    }

    const banks = await Bank.find({ year, semester }).sort({ createdAt: -1 });

    // إضافة الإحصائيات لكل بنك
    const banksWithStats = await Promise.all(
      banks.map(async (bank) => {
        const bankExams: IBankExam[] = await BankExam.find({ bankId: bank._id });
        const bankExamsCount = bankExams.length;
        
        let totalQuestionsCount = 0;
        for (const exam of bankExams) {
          const questionsCount = await SingleQuestionBank.countDocuments({ bankExamId: exam._id });
          totalQuestionsCount += questionsCount;
        }
        
        const bankObject = bank.toObject();
        
        return {
          ...bankObject,
          bankExamsCount,
          totalQuestionsCount,
        };
      })
    );

    return banksWithStats;
  }

  // تحديث بنك
  static async updateBank(bankId: string, data: UpdateBankInput) {
    if (!mongoose.isValidObjectId(bankId)) {
      throw badRequest("معرف غير صالح");
    }

    let parsed: UpdateBankInput;

    try {
      parsed = updateBankSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const bank = await Bank.findById(bankId);
    if (!bank) {
      throw notFound("البنك غير موجود");
    }

    const updated = await Bank.findByIdAndUpdate(bankId, parsed, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!updated) {
      throw notFound("فشل تحديث البنك");
    }

    return {
      message: "تم تحديث البنك بنجاح",
    };
  }

  // حذف بنك (مع حذف جميع الامتحانات والأسئلة المرتبطة)
  static async deleteBank(bankId: string) {
    if (!mongoose.isValidObjectId(bankId)) {
      throw badRequest("معرف غير صالح");
    }

    const bank = await Bank.findById(bankId).select("_id");
    if (!bank) {
      throw notFound("البنك غير موجود");
    }

    // جلب جميع امتحانات هذا البنك
    const bankExams: IBankExam[] = await BankExam.find({ bankId: bank._id });
    
    // حذف جميع الأسئلة المرتبطة بكل امتحان
    for (const exam of bankExams) {
      await SingleQuestionBank.deleteMany({ bankExamId: exam._id });
    }
    
    // حذف جميع امتحانات البنك
    await BankExam.deleteMany({ bankId: bank._id });
    
    // حذف البنك نفسه
    await Bank.findByIdAndDelete(bankId);

    return {
      message: "تم حذف البنك وجميع امتحاناته وأسئلته بنجاح",
      deletedCount: {
        bank: 1,
        exams: bankExams.length,
        questions: await SingleQuestionBank.countDocuments({ 
          bankExamId: { $in: bankExams.map((e: IBankExam) => e._id) } 
        }),
      },
    };
  }

  // الحصول على إحصائيات كاملة للنظام
  static async getSystemStats() {
    const totalBanks = await Bank.countDocuments();
    const totalBankExams = await BankExam.countDocuments();
    const totalQuestions = await SingleQuestionBank.countDocuments();
    
    // البنوك المتاحة
    const availableBanks = await Bank.countDocuments({ available: true });
    
    // البنوك حسب السنة
    const banksByYear = await Bank.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    // البنوك حسب الفصل
    const banksBySemester = await Bank.aggregate([
      {
        $group: {
          _id: "$semester",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      totalBanks,
      totalBankExams,
      totalQuestions,
      availableBanks,
      banksByYear,
      banksBySemester,
    };
  }
}