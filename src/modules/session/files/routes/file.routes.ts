import { Router } from "express";

import { fileController } from "../controllers/file.controller";
import verifyToken from "../../../../core/middlewares/verifyToken";
import checkRole from "../../../../core/middlewares/checkRole";
import { upload } from "../../../../core/middlewares/upload.middleware";

const router: Router = Router();

/**
 * READ (All authenticated users)
 */
router
  .route("/session/:sessionId")
  .get(verifyToken, fileController.getFilesBySessionId);

router
  .route("/course/:courseId")
  .get(verifyToken, fileController.getFilesByCourseId);

router
  .route("/:id")
  .get(verifyToken, fileController.getFileById);

/**
 * ADMIN CRUD
 */
router
  .route("/")
  .post(
    verifyToken,
    checkRole(["admin"]),
    upload, // expects field name: attachedFile
    fileController.createFile
  );

router
  .route("/:id")
  .put(verifyToken, checkRole(["admin"]), fileController.updateFile)
  .delete(verifyToken, checkRole(["admin"]), fileController.deleteFile);

router
  .route("/session/:sessionId/all")
  .delete(
    verifyToken,
    checkRole(["admin"]),
    fileController.deleteFilesBySessionId
  );

export default router;
