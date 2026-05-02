import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { SettingService } from "../services/setting.service";

class SettingController {
  // تفريغ علاقات الطلاب
  resetStudentsRelations = asyncHandler(async (_req: Request, res: Response) => {
    const result = await SettingService.resetStudentsRelations();
    res.status(200).json(result);
  });

   // الحصول على الإحصائيات
  getStatistics = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await SettingService.getStatistics();
    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

export const settingController = new SettingController();