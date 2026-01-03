import crypto from "crypto";
import mongoose from "mongoose";
import { badRequest, notFound } from "../../core/errors/httpErrors";
import { parseBunnyVideoUrl } from "./parseBunnyVideoUrl"; // helper
import { VideoToken } from "../../modules/session/security_video/videoToken.model";

export async function createVideoProxyUrl(params: { 
  sessionId: string;
  videoUrl: string;
  userId?: string;
}) {
  const { sessionId, videoUrl, userId } = params;

  if (!mongoose.isValidObjectId(sessionId)) throw badRequest("المعرف غير صالح");

  const { libraryId, videoId } = parseBunnyVideoUrl(videoUrl);

  const token = crypto.randomBytes(32).toString("hex");

  const created = await VideoToken.create({
    sessionId,
    videoId,
    libraryId,
    token,
    userId: userId ?? null,
  });

  if (!created) throw notFound("فشل إنشاء رمز الفيديو");

  return `https://hackerha.cloud/api/video/play/${token}`;
}
