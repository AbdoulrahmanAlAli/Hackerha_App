import { Router } from "express";
import { authAdminController } from "../controllers/admin.auth.controller";

const router = Router();

// ~ Post => /api/hackit/ctrl/admin/login ~ Login Admin
router.post("/login", authAdminController.loginAdmin);

export default router;
