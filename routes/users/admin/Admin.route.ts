import { Router } from "express";
import { adminController } from "../../../controllers/users/admin/Admin.controller";
import verifyToken from "../../../middlewares/verifyToken";
import checkRole from "../../../middlewares/checkRole";

const router: Router = Router();

// Protected admin routes (require authentication)
router
  .route("/create")
  .post(verifyToken, checkRole(["admin"]), adminController.createNewAdmin);
router.route("/profile/:id").get(verifyToken, adminController.getProfile);
router
  .route("/")
  .get(verifyToken, checkRole(["admin"]), adminController.getAllAdmins);
router.route("/:id").get(verifyToken, adminController.getAdminById);
router.route("/:id").put(verifyToken, adminController.updateAdmin);
router
  .route("/:id")
  .delete(verifyToken, checkRole(["admin"]), adminController.deleteAdmin);
router
  .route("/:id/change-password")
  .put(verifyToken, checkRole(["admin"]), adminController.changePassword);

export default router;
