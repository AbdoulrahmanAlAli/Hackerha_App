import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { BankService } from "../services/bank.service";
import { AuthenticatedRequest } from "../../../core/http/authenticatedRequest";
import { ICloudinaryFile } from "../../../core/types/cloudinary.types";

class BankController {
  createBank = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as ICloudinaryFile | undefined;
    const result = await BankService.createBank(req.body, file);
    res.status(201).json(result);
  });

  getBankById = asyncHandler(async (req: Request, res: Response) => {
    const bank = await BankService.getBankById(req.params.id);
    res.status(200).json(bank);
  });

  getAllBanks = asyncHandler(async (req: Request, res: Response) => {
    const { year, semester } = req.query;
    
    const filters: { year?: string; semester?: string } = {};
    if (year && typeof year === 'string') filters.year = year;
    if (semester && typeof semester === 'string') filters.semester = semester;
    
    const result = await BankService.getAllBanks(filters);
    res.status(200).json(result);
  });

  getBanksByYearAndSemester = asyncHandler(async (req: Request, res: Response) => {
    const { year, semester } = req.params;
    const banks = await BankService.getBanksByYearAndSemester(year, semester);
    res.status(200).json(banks);
  });

  updateBank = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as ICloudinaryFile | undefined;
    const result = await BankService.updateBank(req.params.id, req.body, file);
    res.status(200).json(result);
  });

  deleteBankImage = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankService.deleteBankImage(req.params.id);
    res.status(200).json(result);
  });

  deleteBank = asyncHandler(async (req: Request, res: Response) => {
    const result = await BankService.deleteBank(req.params.id);
    res.status(200).json(result);
  });

  getSystemStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await BankService.getSystemStats();
    res.status(200).json(stats);
  });
}

export const bankController = new BankController();