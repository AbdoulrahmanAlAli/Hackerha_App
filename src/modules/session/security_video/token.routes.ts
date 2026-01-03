import { Router } from "express";
import verifyToken from "../../../core/middlewares/verifyToken";
import { videoTokenController } from "./token.controller";


const router = Router();

// إنشاء token (يتطلب توثيق)
router.post("/", verifyToken, videoTokenController.createVideoToken);

// تشغيل الفيديو عبر token (عام)
router.get("/play/:token", videoTokenController.playVideoWithToken);

export default router;
