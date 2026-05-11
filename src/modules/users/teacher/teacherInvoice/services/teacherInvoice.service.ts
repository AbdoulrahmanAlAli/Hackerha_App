import mongoose from "mongoose";
import { TeacherInvoice } from "../models/teacherInvoice.model";
import { Teacher } from "../../models/teacher.model";
import {
  createTeacherInvoiceSchema,
  updateTeacherInvoiceSchema,
} from "../schemas/teacherInvoice.schema";
import { badRequest, notFound } from "../../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../../core/http/zodMessage";
import { Course } from "../../../../course/models/course.model";
import { Payment } from "../../../../payment/models/payment.model";

export class CtrlTeacherInvoiceService {
 // ~ POST => Create invoice
    static async createInvoice(data: any) {
    let parsed: any;
    try {
      parsed = createTeacherInvoiceSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const teacher = await Teacher.findById(parsed.teacherId);
    if (!teacher) throw notFound("الأستاذ غير موجود");

    // جلب جميع الكورسات الخاصة بالأستاذ
    const courses = await Course.find({ teachers: teacher._id }).select("_id");
    const courseIds = courses.map(course => course._id);
    
    // جلب جميع المدفوعات للكورسات
    const payments = await Payment.find({
      courseId: { $in: courseIds },
    }).lean();
    
    // حساب إجمالي الإيرادات
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.price, 0);
    
    // ✅ حساب أرباح الأستاذ المستحقة بناءً على نسبته
    const teacherPercentage = teacher.percentage || 0;
    const teacherEarnings = (totalRevenue * teacherPercentage) / 100;
    
    // جلب جميع الفواتير السابقة للأستاذ
    const previousInvoices = await TeacherInvoice.find({ 
      teacherId: teacher._id 
    }).lean();
    
    // حساب المبلغ المقدم سابقاً
    const totalPriceTaken = previousInvoices.reduce((sum, inv) => sum + inv.priceTaken, 0);
    
    // ✅ حساب المبلغ المتبقي من أرباح الأستاذ وليس من totalRevenue
    const remainingEarnings = teacherEarnings - totalPriceTaken;
    
    // التحقق
    if (remainingEarnings <= 0) {
      throw badRequest(`لا يوجد مبلغ متبقي. أرباح الأستاذ: ${teacherEarnings}, المأخوذ: ${totalPriceTaken}`);
    }
    
    if (parsed.priceTaken > remainingEarnings) {
      throw badRequest(`المبلغ المطلوب (${parsed.priceTaken}) يتجاوز المتبقي (${remainingEarnings})`);
    }
    
    // ✅ إنشاء الفاتورة
    const invoice = await TeacherInvoice.create({
      ...parsed,
      total: remainingEarnings, // ✅ الآن ستكون 10 وليس 40
    });

    return {
      message: "تم إنشاء الفاتورة بنجاح",
      invoice
    };
  }
  // ~ PUT => Update invoice
  static async updateInvoice(invoiceId: string, data: any) {
    if (!mongoose.isValidObjectId(invoiceId)) {
      throw badRequest("معرف الفاتورة غير صالح");
    }

    let parsed: any;
    try {
      parsed = updateTeacherInvoiceSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const invoice = await TeacherInvoice.findByIdAndUpdate(
      invoiceId,
      { $set: parsed },
      { new: true, runValidators: true },
    );

    if (!invoice) throw notFound("الفاتورة غير موجودة");

    return {
      message: "تم تحديث الفاتورة بنجاح",
      invoice,
    };
  }

  // ~ DELETE => Delete invoice
  static async deleteInvoice(invoiceId: string) {
    if (!mongoose.isValidObjectId(invoiceId)) {
      throw badRequest("معرف الفاتورة غير صالح");
    }

    const invoice = await TeacherInvoice.findByIdAndDelete(invoiceId);

    if (!invoice) throw notFound("الفاتورة غير موجودة");

    return {
      message: "تم حذف الفاتورة بنجاح",
    };
  }

  // ~ GET => Teacher invoices
  static async getTeacherInvoices(teacherId: string) {
    if (!mongoose.isValidObjectId(teacherId)) {
      throw badRequest("معرف الأستاذ غير صالح");
    }

    const invoices = await TeacherInvoice.find({ teacherId }).sort({
      createdAt: -1,
    });

    return invoices
  }
}
