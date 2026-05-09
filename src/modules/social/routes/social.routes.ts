import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";
import { socialController } from "../controllers/social.controller";

const router: Router = Router();

// GET /api/hackit/ctrl/social - Get all social media (protected)
router.get("/", socialController.getAllSocial);

// POST /api/hackit/ctrl/social - Create new social media (admin only)
router.post("/", verifyToken, requireAdmin, socialController.createSocial);

// GET /api/hackit/ctrl/social/:id - Get single social media (protected)
router.get("/:id", socialController.getSocialById);

// PUT /api/hackit/ctrl/social/:id - Update social media (admin only)
router.put("/:id", verifyToken, requireAdmin, socialController.updateSocial);

// DELETE /api/hackit/ctrl/social/:id - Delete social media (admin only)
router.delete("/:id", verifyToken, requireAdmin, socialController.deleteSocial);

export default router;
