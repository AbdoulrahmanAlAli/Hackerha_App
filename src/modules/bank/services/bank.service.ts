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
import { ICloudinaryFile } from "../../../core/types/cloudinary.types";
import { IBankExam } from "../../bankExam/types/bank-exam.types";
import { BankExam } from "../../bankExam/models/bank-exam.model";
import { SingleQuestionBank } from "../../bankExam/single-question/models/question.model";

export class BankService {
  // إنشاء بنك جديد (available سيكون false تلقائياً)
  static async createBank(data: CreateBankInput, file?: ICloudinaryFile) {
    let parsed: CreateBankInput;

    try {
      parsed = createBankSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // استخدام الصورة المرفوعة أو الصورة من البيانات
    const image = file?.path;

    if (!image) {
      throw badRequest("الصورة مطلوبة");
    }

    // إنشاء البنك - available سيأخذ القيمة الافتراضية false من الـ Schema
    const bank = await Bank.create({
      title: parsed.title,
      image: image,
      year: parsed.year,
      semester: parsed.semester,
    });

    return {
      id: bank.id,
      message: "تم إنشاء البنك بنجاح",
    };
  }

  // جلب بنك واحد بواسطة id (حسب دور المستخدم)
  static async getBankById(id: string, userRole: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw badRequest("معرف غير صالح");
    }

    let query: any = { _id: id };
    
    // إذا كان المستخدم طالب، يعرض فقط البنوك المتاحة
    if (userRole === 'student') {
      query.available = true;
    }

    const bank = await Bank.findOne(query);

    if (!bank) {
      throw notFound("البنك غير موجود");
    }

    // جلب إحصائيات الامتحانات والأسئلة
    let bankExamsQuery: any = { bankId: bank._id };
    
    // إذا كان طالب، يعرض فقط الامتحانات المتاحة
    if (userRole === 'student') {
      bankExamsQuery.available = true;
    }
    
    const bankExams: IBankExam[] = await BankExam.find(bankExamsQuery);
    
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

  // جلب كل البنوك (حسب دور المستخدم)
  static async getAllBanks(userRole: string, filters?: { year?: string; semester?: string }) {
    // بناء query للتصفية
    let query: any = {};
    
    // إضافة الفلاتر إذا وجدت
    if (filters?.year) query.year = filters.year;
    if (filters?.semester) query.semester = filters.semester;
    
    // إذا كان المستخدم طالب، يعرض فقط البنوك المتاحة
    if (userRole === 'student') {
      query.available = true;
    }

    // جلب البنوك مع الترتيب
    const banks = await Bank.find(query).sort({ createdAt: -1 });

    // جلب الإحصائيات لكل بنك
    const banksWithStats = await Promise.all(
      banks.map(async (bank) => {
        // بناء query للامتحانات حسب دور المستخدم
        let bankExamsQuery: any = { bankId: bank._id };
        if (userRole === 'student') {
          bankExamsQuery.available = true;
        }
        
        // جلب امتحانات هذا البنك
        const bankExams: IBankExam[] = await BankExam.find(bankExamsQuery);
        
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

    // إضافة إحصائيات عامة (للمشرفين فقط)
    if (userRole === 'admin') {
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

    // للطلاب، يعرض فقط البنوك بدون إحصائيات عامة
    return banksWithStats;
  }

  // تحديث بنك (للمشرفين فقط)
  static async updateBank(bankId: string, data: UpdateBankInput, file?: ICloudinaryFile) {
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

    // تحضير بيانات التحديث
    const updateData: any = { ...parsed };
    
    // إذا تم رفع ملف جديد، استخدمه كصورة
    if (file) {
      updateData.image = file.path;
    }

    const updated = await Bank.findByIdAndUpdate(bankId, updateData, {
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

  // حذف صورة البنك (للمشرفين فقط)
  static async deleteBankImage(bankId: string) {
    if (!mongoose.isValidObjectId(bankId)) {
      throw badRequest("معرف غير صالح");
    }

    const bank = await Bank.findById(bankId);
    if (!bank) {
      throw notFound("البنك غير موجود");
    }

    bank.image = "";
    await bank.save();

    return { 
      message: "تم حذف صورة البنك بنجاح" 
    };
  }

  // حذف بنك (للمشرفين فقط)
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
      },
    };
  }

  // الحصول على إحصائيات كاملة للنظام (للمشرفين فقط)
  static async getSystemStats() {
    const totalBanks = await Bank.countDocuments();
    const totalAvailableBanks = await Bank.countDocuments({ available: true });
    const totalBankExams = await BankExam.countDocuments();
    const totalQuestions = await SingleQuestionBank.countDocuments();
    
    // البنوك حسب السنة
    const banksByYear = await Bank.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ["$available", true] }, 1, 0] }
          }
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
          availableCount: {
            $sum: { $cond: [{ $eq: ["$available", true] }, 1, 0] }
          }
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      totalBanks,
      totalAvailableBanks,
      totalBankExams,
      totalQuestions,
      banksByYear,
      banksBySemester,
    };
  }
}