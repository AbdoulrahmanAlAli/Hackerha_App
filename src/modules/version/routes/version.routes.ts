import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import checkRole from "../../../core/middlewares/checkRole";
import { ctrlVersionController } from "../controllers/version.controller";

const router: Router = Router();

// Get /api/hackit/version/current (Public)
router.get("/current", ctrlVersionController.getCurrentVersion);

// Get /api/hackit/ctrl/version
router.get(
  "/",
  verifyToken,
  checkRole(["admin"]),
  ctrlVersionController.getAllVersions,
);

// Post /api/hackit/ctrl/version
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  ctrlVersionController.createVersion,
);

// Get /api/hackit/ctrl/version/:id
router.get(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlVersionController.getVersionById,
);

// Put /api/hackit/ctrl/version/:id
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlVersionController.updateVersion,
);

// Delete /api/hackit/ctrl/version/:id
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  ctrlVersionController.deleteVersion,
);

export default router;
