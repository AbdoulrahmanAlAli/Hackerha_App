import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { FileService } from "../services/file.service";
import { ICloudinaryFile } from "../../../../core/types/cloudinary.types";

class FileController {
  // Admin: Create file (PDF) + attach to session (push order)
  createFile = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.createFile(
      req.body,
      req.file as ICloudinaryFile
    );
    res.status(201).json(result);
  });

  // All (token): Get file by ID
  getFileById = asyncHandler(async (req: Request, res: Response) => {
    const file = await FileService.getFileById(req.params.id);
    res.status(200).json(file);
  });

  // All (token): Get files by sessionId (returns in session.files order)
  getFilesBySessionId = asyncHandler(async (req: Request, res: Response) => {
    const files = await FileService.getFilesBySessionId(req.params.sessionId);
    res.status(200).json(files);
  });

  // All (token): Get files by courseId
  getFilesByCourseId = asyncHandler(async (req: Request, res: Response) => {
    const files = await FileService.getFilesByCourseId(req.params.courseId);
    res.status(200).json(files);
  });

  // Admin: Update file meta (name/description)
  updateFile = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.updateFile(req.params.id, req.body);
    res.status(200).json(result);
  });

  // Admin: Delete file + pull from session.files
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.deleteFile(req.params.id);
    res.status(200).json(result);
  });

  // Admin: Delete all files for session + clear session.files
  deleteFilesBySessionId = asyncHandler(async (req: Request, res: Response) => {
    const result = await FileService.deleteFilesBySessionId(
      req.params.sessionId
    );
    res.status(200).json(result);
  });
}

export const fileController = new FileController();
