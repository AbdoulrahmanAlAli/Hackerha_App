import { Router } from "express";
import { adsController } from "../controllers/ads.controller";
import verifyToken from "../../../core/middlewares/verifyToken";
import { upload } from "../../../core/middlewares/upload.middleware";
import { requireAdmin } from "../../../core/middlewares/requireRole.middleware";

const router: Router = Router();

// GET /api/hackit/ctrl/ads - Get all ads (protected)
router.get("/", verifyToken, adsController.getAllAds);

// POST /api/hackit/ctrl/ads - Create new ad (admin only)
router.post("/", verifyToken, requireAdmin, upload, adsController.createAds);

// GET /api/hackit/ctrl/ads/:id - Get single ad (protected)
router.get("/:id", verifyToken, adsController.getAdsById);

// PUT /api/hackit/ctrl/ads/:id - Update ad (admin only)
router.put("/:id", verifyToken, requireAdmin, upload, adsController.updateAds);

// DELETE /api/hackit/ctrl/ads/:id - Delete ad (admin only)
router.delete("/:id", verifyToken, requireAdmin, adsController.deleteAds);

export default router;
