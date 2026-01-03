import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import verifyToken from "../../../../core/middlewares/verifyToken";
import checkRole from "../../../../core/middlewares/checkRole";

const router = Router();

// Protected admin routes (require authentication)
router.post("/create", adminController.createNewAdmin);

router.get("/profile/:id", verifyToken, adminController.getProfile);

router.get(
  "/",
  verifyToken,
  checkRole(["admin"]),
  adminController.getAllAdmins
);

router.get("/:id", verifyToken, adminController.getAdminById);

router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  adminController.updateAdmin
);

router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  adminController.deleteAdmin
);

router.put(
  "/:id/change-password",
  verifyToken,
  checkRole(["admin"]),
  adminController.changePassword
);

export default router;
