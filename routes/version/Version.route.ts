// src/routes/version/version.route.ts
import { Router } from "express";
import { versionController } from "../../controllers/version/Version.controller";
import verifyToken from "../../middlewares/verifyToken";
import checkRole from "../../middlewares/checkRole";

const router: Router = Router();

// Public routes
router.route("/current").get(versionController.getCurrentVersion);

// Protected admin routes
router
  .route("/")
  .get(verifyToken, checkRole(["admin"]), versionController.getAllVersions)
  .post(verifyToken, checkRole(["admin"]), versionController.createVersion);

router
  .route("/:id")
  .get(verifyToken, checkRole(["admin"]), versionController.getVersionById)
  .put(verifyToken, checkRole(["admin"]), versionController.updateVersion)
  .delete(verifyToken, checkRole(["admin"]), versionController.deleteVersion);

export default router;
