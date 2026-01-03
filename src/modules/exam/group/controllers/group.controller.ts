import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { GroupService } from "../services/group.service"; // عدّل المسار حسب مشروعك

class GroupController {
  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const result = await GroupService.createGroup(req.body);
    res.status(201).json(result);
  });

  getGroupById = asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupService.getGroupById(req.params.id);
    res.status(200).json(group);
  });

  getGroupsByExamId = asyncHandler(async (req: Request, res: Response) => {
    const groups = await GroupService.getGroupsByExamId(req.params.examId);
    res.status(200).json(groups);
  });

  updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const result = await GroupService.updateGroup(req.params.id, req.body);
    res.status(200).json(result);
  });

  deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const result = await GroupService.deleteGroup(req.params.id);
    res.status(200).json(result);
  });

  deleteGroupsByExamId = asyncHandler(async (req: Request, res: Response) => {
    const result = await GroupService.deleteGroupsByExamId(req.params.examId);
    res.status(200).json(result);
  });
}

export const groupController = new GroupController();
