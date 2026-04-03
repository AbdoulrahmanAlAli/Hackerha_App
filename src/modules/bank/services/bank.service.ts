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
// import { Group } from "../group/models/group.model";
// import { Question } from "../group/question/models/question.model";

export class BankService {
  // إنشاء بنك جديد
  static async createBank(data: CreateBankInput) {
    let parsed: CreateBankInput;

    try {
      // التحقق من البيانات القادمة
      parsed = createBankSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // إنشاء البنك في قاعدة البيانات
    const bank = await Bank.create(parsed);

    return {
      id: bank.id,
      message: "تم إنشاء البنك بنجاح",
    };
  }

  // جلب بنك واحد بواسطة id
  static async getBankById(id: string) {
    // التحقق من صحة الـ id
    if (!mongoose.isValidObjectId(id)) {
      throw badRequest("معرف غير صالح");
    }

    const bank = await Bank.findById(id);

    // إذا لم يكن موجوداً
    if (!bank) {
      throw notFound("البنك غير موجود");
    }

    return bank;
  }

  // جلب كل البنوك
  static async getAllBanks() {
    // ترتيب تنازلي حسب تاريخ الإنشاء
    const banks = await Bank.find().sort({ createdAt: -1 });
    return banks;
  }

  // تحديث بنك
  static async updateBank(bankId: string, data: UpdateBankInput) {
    // التحقق من صحة المعرف
    if (!mongoose.isValidObjectId(bankId)) {
      throw badRequest("معرف غير صالح");
    }

    let parsed: UpdateBankInput;

    try {
      // التحقق من البيانات قبل التحديث
      parsed = updateBankSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    // التأكد أن البنك موجود
    const bank = await Bank.findById(bankId);
    if (!bank) {
      throw notFound("البنك غير موجود");
    }

    // تنفيذ التحديث
    const updated = await Bank.findByIdAndUpdate(bankId, parsed, {
      new: true, // يرجع النسخة المحدثة
      runValidators: true, // يشغل validators الخاصة بـ mongoose
    }).select("-__v");

    if (!updated) {
      throw notFound("فشل تحديث البنك");
    }

    return {
      message: "تم تحديث البنك بنجاح",
    };
  }

//   // حذف بنك
//   static async deleteBank(bankId: string) {
//     // التحقق من صحة المعرف
//     if (!mongoose.isValidObjectId(bankId)) {
//       throw badRequest("معرف غير صالح");
//     }

//     // التأكد من وجود البنك
//     const bank = await Bank.findById(bankId).select("_id");
//     if (!bank) {
//       throw notFound("البنك غير موجود");
//     }

//     // 1) جلب المجموعات المرتبطة بالبنك
//     const groups = await Group.find({ bankId: bank._id }).select("_id").lean();
//     const groupIds = groups.map((g) => g._id);

//     // 2) حذف الأسئلة المرتبطة بهذه المجموعات
//     if (groupIds.length) {
//       await Question.deleteMany({ groupId: { $in: groupIds } });
//     }

//     // 3) حذف المجموعات المرتبطة بالبنك
//     await Group.deleteMany({ bankId: bank._id });

//     // 4) حذف البنك نفسه
//     await Bank.findByIdAndDelete(bankId);

//     return {
//       message: "تم حذف البنك بنجاح",
//     };
//   }
}