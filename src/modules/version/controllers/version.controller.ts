import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CtrlVersionService } from "../services/version.service";

class CtrlVersionController {
  // GET /api/hackit/version/current
  getCurrentVersion = asyncHandler(async (_req: Request, res: Response) => {
    const version = await CtrlVersionService.getCurrentVersion();
    res.status(200).json(version);
  });

  // POST /api/hackit/ctrl/version
  createVersion = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlVersionService.createVersion(req.body);
    res.status(201).json(result);
  });

  // GET /api/hackit/ctrl/version
  getAllVersions = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await CtrlVersionService.getAllVersions(page, limit);
    res.status(200).json(result);
  });

  // GET /api/hackit/ctrl/version/:id
  getVersionById = asyncHandler(async (req: Request, res: Response) => {
    const version = await CtrlVersionService.getVersionById(req.params.id);
    res.status(200).json(version);
  });

  // PUT /api/hackit/ctrl/version/:id
  updateVersion = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlVersionService.updateVersion(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  });

  // DELETE /api/hackit/ctrl/version/:id
  deleteVersion = asyncHandler(async (req: Request, res: Response) => {
    const result = await CtrlVersionService.deleteVersion(req.params.id);
    res.status(200).json(result);
  });
}

export const ctrlVersionController = new CtrlVersionController();
