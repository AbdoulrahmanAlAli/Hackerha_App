import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlTeacherInvoiceService } from "../services/teacherInvoice.service";
import { AuthenticatedRequest } from "../../../../../core/http/authenticatedRequest";
import { notFound } from "../../../../../core/errors/httpErrors";

class CtrlTeacherInvoiceController {
  // POST /api/hackit/teacher-invoices
  createInvoice = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw notFound("لا يوجد مستخدم");

    const result = await CtrlTeacherInvoiceService.createInvoice(req.body);

    res.status(201).json(result);
  });

  // PUT /api/hackit/teacher-invoices/:id
  updateInvoice = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw notFound("لا يوجد مستخدم");

    const { id } = req.params;
    const result = await CtrlTeacherInvoiceService.updateInvoice(id, req.body);

    res.status(200).json(result);
  });

  // DELETE /api/hackit/teacher-invoices/:id
  deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw notFound("لا يوجد مستخدم");

    const { id } = req.params;
    const result = await CtrlTeacherInvoiceService.deleteInvoice(id);

    res.status(200).json(result);
  });

  // GET /api/hackit/teacher-invoices/teacher/:id
  getTeacherInvoices = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CtrlTeacherInvoiceService.getTeacherInvoices(id);

    res.status(200).json(result);
  });
}

export const ctrlTeacherInvoiceController = new CtrlTeacherInvoiceController();
