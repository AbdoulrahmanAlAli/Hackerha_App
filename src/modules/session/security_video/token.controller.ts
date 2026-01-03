import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../../core/http/authenticatedRequest";
import { VideoTokenService } from "./videoToken.service";

class VideoTokenController {
  // POST /api/video  (Authenticated)
  createVideoToken = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, videoUrl } = req.body;
    const userId = (req as AuthenticatedRequest).user!.id;

    const tokenUrl = await VideoTokenService.createVideoToken(
      sessionId,
      videoUrl,
      userId
    );

    res.status(201).json({
      success: true,
      data: { tokenUrl },
      message: "تم إنشاء رابط الفيديو لمرة واحدة",
    });
  });

  // GET /api/video/play/:token  (Public)
  playVideoWithToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const result = await VideoTokenService.verifyAndUseToken(token);
    return res.redirect(result.videoUrl);
  });
}

export const videoTokenController = new VideoTokenController();
