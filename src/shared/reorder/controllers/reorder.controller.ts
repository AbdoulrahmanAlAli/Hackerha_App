import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlReorderService } from "../services/reorder.service";
import { badRequest } from "../../../core/errors/httpErrors";

class CtrlReorderController {
  // POST /api/hackit/ctrl/reorder/:courseId
  reorderContent = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      throw badRequest("يجب إرسال مصفوفة orderedIds");
    }

    const result = await CtrlReorderService.reorderContent(
      courseId,
      orderedIds,
    );
    res.status(200).json(result);
  });
}

export const ctrlReorderController = new CtrlReorderController();
