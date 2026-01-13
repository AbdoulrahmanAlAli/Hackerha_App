import type { Request, Response } from "express";
import { AuthAdminService } from "../services/admin.auth.service";
import asyncHandler from "express-async-handler";

export class AuthAdminController {
  // Post /api/hackit/ctrl/admin/login
  loginAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthAdminService.loginAdmin(req.body);
    res.status(200).json({ message: result.message, token: result.token });
  });
}

export const authAdminController = new AuthAdminController();
