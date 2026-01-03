import { Router } from "express";
import { authAdminController } from "../controllers/admin.auth.controller";

const router = Router();

// Public auth routes
router.post("/login", authAdminController.loginAdmin);

export default router;
