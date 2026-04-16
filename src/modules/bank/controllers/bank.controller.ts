import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { BankService } from "../services/bank.service";

class BankController {
  // إنشاء بنك
  createBank = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankService.createBank(req.body);
    res.status(201).json(result);
  });

  // جلب بنك واحد
  getBankById = asyncHandler(async (req: Request, res: Response) => {
    const bank = await BankService.getBankById(req.params.id);
    res.status(200).json(bank);
  });

  // جلب جميع البنوك
  getAllBanks = asyncHandler(async (_req: Request, res: Response) => {
    const banks = await BankService.getAllBanks();
    res.status(200).json(banks);
  });

  // تحديث بنك
  updateBank = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankService.updateBank(req.params.id, req.body);
    res.status(200).json(result);
  });

  // حذف بنك
  deleteBank = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankService.deleteBank(req.params.id);
    res.status(200).json(result);
  });
}

export const bankController = new BankController();