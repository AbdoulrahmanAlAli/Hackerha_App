import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { BankExamService } from "../services/bank-exam.service";
import { AuthenticatedRequest } from "../../../core/http/authenticatedRequest";
import { badRequest } from "../../../core/errors/httpErrors";

class BankExamController {
  createBankExam = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankExamService.createBankExam(req.body);
    res.status(201).json(result);
  });

  getBankExamById = asyncHandler(async (req: Request, res: Response) => {
    const bankExam = await BankExamService.getBankExamById(req.params.id);
    res.status(200).json(bankExam);
  });

  getBankExamsByBankId = asyncHandler(async (req: Request, res: Response) => {
    const userRole = (req as AuthenticatedRequest).user?.role;
    
    if (!userRole) {
      throw badRequest("دور المستخدم غير محدد");
    }

    const bankExams = await BankExamService.getBankExamsByBankId(req.params.bankId, userRole);
    res.status(200).json(bankExams);
  });

  updateBankExam = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankExamService.updateBankExam(req.params.id, req.body);
    res.status(200).json(result);
  });

  deleteBankExam = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankExamService.deleteBankExam(req.params.id);
    res.status(200).json(result);
  });
}

export const bankExamController = new BankExamController();