import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlPaymentService } from "../services/payment.service";
import { AuthenticatedRequest } from "../../../core/http/authenticatedRequest";
import { badRequest, notFound } from "../../../core/errors/httpErrors";

class CtrlPaymentController {
  // POST /api/hackit/payment/code
  generatePaymentCode = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw notFound("لا يوجد مستخدم");

    const result = await CtrlPaymentService.generatePaymentCode(
      req.body,
      user.id,
    );

    res.status(201).json(result);
  });

  // POST /api/hackit/payment/verify
  verifyPaymentCode = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw badRequest("المستخدم غير مصادق عليه");

    const result = await CtrlPaymentService.verifyPaymentCode({
      ...req.body,
      studentId: user.id,
    });

    res.status(200).json(result);
  });

  // GET /api/hackit/payment/codes
  getAllPaymentCodes = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlPaymentService.getAllPaymentCodes(req.query);
    res.status(200).json(result);
  });

  // GET /api/hackit/payment/codes/:universityNumber
  getStudentPaymentCodes = asyncHandler(async (req: Request, res: Response) => {
    const universityNumber = Number(req.params.universityNumber);
    if (isNaN(universityNumber)) throw badRequest("الرقم الجامعي غير صالح");

    const result =
      await CtrlPaymentService.getStudentPaymentCodes(universityNumber);

    res.status(200).json(result);
  });
}

export const ctrlPaymentController = new CtrlPaymentController();
