import mongoose from "mongoose";
import { TeacherInvoice } from "../models/teacherInvoice.model";
import { Teacher } from "../../models/teacher.model";
import {
  createTeacherInvoiceSchema,
  updateTeacherInvoiceSchema,
} from "../schemas/teacherInvoice.schema";
import { badRequest, notFound } from "../../../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../../../core/http/zodMessage";

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

    const invoice = await TeacherInvoice.create(parsed);

    return {
      message: "تم إنشاء الفاتورة بنجاح",
      invoice,
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
