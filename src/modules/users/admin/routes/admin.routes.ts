import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import verifyToken from "../../../../core/middlewares/verifyToken";
import checkRole from "../../../../core/middlewares/checkRole";

const router = Router();

// Post /api/hackit/ctrl/admin/create
router.post("/create", adminController.createNewAdmin);

// Get /api/hackit/ctrl/admin/admin/profile/:id
router.get("/profile/:id", verifyToken, adminController.getProfile);

// Get /api/hackit/ctrl/admin/
router.get(
  "/",
  verifyToken,
  checkRole(["admin"]),
  adminController.getAllAdmins
);

// Get /api/hackit/ctrl/admin/:id
router.get("/:id", verifyToken, adminController.getAdminById);

// Put /api/hackit/ctrl/admin/:id
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  adminController.updateAdmin
);

// Delete /api/hackit/ctrl/admin/:id
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  adminController.deleteAdmin
);

// Put /api/hackit/ctrl/admin/:id/change-password
router.put(
  "/:id/change-password",
  verifyToken,
  checkRole(["admin"]),
  adminController.changePassword
);

export default router;
