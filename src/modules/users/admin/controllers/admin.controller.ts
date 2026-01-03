import type { Request, Response } from "express";
import { forbidden, badRequest } from "../../../../core/errors/httpErrors";
import { AdminService } from "../services/admin.service";
import asyncHandler from "express-async-handler";

export class AdminController {
  // ~ Post => /api/hackit/ctrl/admin/create ~ Create New Admin
  createNewAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdminService.createNewAdmin(req.body);
    res.status(201).json(result);
  });

  // ~ Get => /api/hackit/ctrl/admin/admin/profile/:id ~ Get Admin Profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const targetUserId = req.params.id;

    if (!user?.id) throw forbidden("غير مصرح لك");
    if (!targetUserId) throw badRequest("معرف المسؤول مطلوب");

    if (user.id !== targetUserId) {
      throw forbidden("غير مصرح لك");
    }

    const result = await AdminService.getProfile(targetUserId);
    res.status(200).json(result);
  });

  // ~ Get => /api/hackit/ctrl/admin/:id ~ Get Admin By ID
  getAdminById = asyncHandler(async (req: Request, res: Response) => {
    const admin = await AdminService.getAdminById(req.params.id);
    res.status(200).json(admin);
  });

  // ~ Get => /api/hackit/ctrl/admin/ ~ Get All Admins
  getAllAdmins = asyncHandler(async (_req: Request, res: Response) => {
    const admins = await AdminService.getAllAdmins();
    res.status(200).json(admins);
  });

  // ~ Put => /api/hackit/ctrl/admin/:id ~ Update Admin
  updateAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdminService.updateAdmin(req.params.id, req.body);
    res.status(200).json(result);
  });

  // ~ Delete => /api/hackit/ctrl/admin/:id ~ Delete Admin
  deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdminService.deleteAdmin(req.params.id);
    res.status(200).json(result);
  });

  // ~ Put => /api/hackit/ctrl/admin/:id/change-password ~ Change Password
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body ?? {};

    const result = await AdminService.changePassword(
      req.params.id,
      currentPassword,
      newPassword
    );

    res.status(200).json(result);
  });
}

export const adminController = new AdminController();
