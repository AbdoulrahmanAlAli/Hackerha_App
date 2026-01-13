import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { FileService } from "../services/file.service";

class FileController {
  // Post /api/hackit/ctrl/file
  createFile = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.createFile(req.body);
    res.status(201).json(result);
  });

  // Get /api/hackit/ctrl/file/:id
  getFileById = asyncHandler(async (req: Request, res: Response) => {
    const file = await FileService.getFileById(req.params.id);
    res.status(200).json(file);
  });

  // Get /api/hackit/ctrl/file/session/:sessionId
  getFilesBySessionId = asyncHandler(async (req: Request, res: Response) => {
    const files = await FileService.getFilesBySessionId(req.params.sessionId);
    res.status(200).json(files);
  });

  // Get /api/hackit/ctrl/file/course/:courseId
  getFilesByCourseId = asyncHandler(async (req: Request, res: Response) => {
    const files = await FileService.getFilesByCourseId(req.params.courseId);
    res.status(200).json(files);
  });

  // Put /api/hackit/ctrl/file/:id
  updateFile = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.updateFile(req.params.id, req.body);
    res.status(200).json(result);
  });

  // Delete /api/hackit/ctrl/file/:id
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.deleteFile(req.params.id);
    res.status(200).json(result);
  });

  // Delete /api/hackit/ctrl/file/session/:sessionId/all
  deleteFilesBySessionId = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.deleteFilesBySessionId(
      req.params.sessionId
    );
    res.status(200).json(result);
  });
}

export const fileController = new FileController();
