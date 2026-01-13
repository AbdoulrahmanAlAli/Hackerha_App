import { Router } from "express";

import { fileController } from "../controllers/file.controller";
import verifyToken from "../../../../core/middlewares/verifyToken";
import checkRole from "../../../../core/middlewares/checkRole";
import { upload } from "../../../../core/middlewares/upload.middleware";

const router: Router = Router();

// Get /api/hackit/ctrl/file/session/:sessionId
router
  .route("/session/:sessionId")
  .get(verifyToken, fileController.getFilesBySessionId);

// Get /api/hackit/ctrl/file/course/:courseId
router
  .route("/course/:courseId")
  .get(verifyToken, fileController.getFilesByCourseId);

// Get /api/hackit/ctrl/file/:id
router.route("/:id").get(verifyToken, fileController.getFileById);

// Post /api/hackit/ctrl/file
router.route("/").post(
  verifyToken,
  checkRole(["admin"]),
  upload, // expects field name: attachedFile
  fileController.createFile
);

// Put /api/hackit/ctrl/file/:id
router
  .route("/:id")
  .put(verifyToken, checkRole(["admin"]), fileController.updateFile);

// Delete /api/hackit/ctrl/file/:id
router
  .route("/:id")
  .delete(verifyToken, checkRole(["admin"]), fileController.deleteFile);

// Delete /api/hackit/ctrl/file/session/:sessionId/all
router
  .route("/session/:sessionId/all")
  .delete(
    verifyToken,
    checkRole(["admin"]),
    fileController.deleteFilesBySessionId
  );

export default router;
