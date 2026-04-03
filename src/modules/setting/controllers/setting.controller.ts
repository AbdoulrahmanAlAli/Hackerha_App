import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { SettingService } from "../services/setting.service";

class SettingController {
  // تفريغ علاقات الطلاب
  resetStudentsRelations = asyncHandler(async (_req: Request, res: Response) => {
    const result = await SettingService.resetStudentsRelations();
    res.status(200).json(result);
  });
}

export const settingController = new SettingController();