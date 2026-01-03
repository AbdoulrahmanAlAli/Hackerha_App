import crypto from "crypto";
import mongoose from "mongoose";
import { badRequest, notFound } from "../../../core/errors/httpErrors";
import { VideoToken } from "./videoToken.model";
import { createVideoTokenSchema, playVideoSchema } from "./videoToken.schema";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { generateBunnySignedIframeUrl } from "../../../shared/video/generateBunnySignedIframeUrl";
import { parseBunnyVideoUrl } from "../../../shared/video/parseBunnyVideoUrl";

const TOKEN_TTL_SECONDS = Number(process.env.VIDEO_TOKEN_TTL_SECONDS ?? 30);
const SIGNED_IFRAME_TTL_SECONDS = Number(
  process.env.BUNNY_SIGNED_TTL_SECONDS ?? 8
);
const VIDEO_PROXY_BASE_URL =
  process.env.VIDEO_PROXY_BASE_URL || "https://hackerhaapp-production.up.railway.app";

export class VideoTokenService {
  // إنشاء توكن (One-Time) — الأفضل أن يُستعمل داخلياً من SessionService
  static async createVideoToken(
    sessionId: string,
    videoUrl: string,
    userId?: string
  ) {
    if (!mongoose.isValidObjectId(sessionId)) throw badRequest("معرف غير صالح");

    // parse رابط bunny بشكل آمن
    const { libraryId, videoId } = parseBunnyVideoUrl(videoUrl);

    // token فريد
    const token = crypto.randomBytes(32).toString("hex"); // 64 hex

    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

    await VideoToken.create({
      token,
      sessionId,
      userId: userId && mongoose.isValidObjectId(userId) ? userId : null,
      libraryId,
      videoId,
      expiresAt,
      used: false,
    });

    return `${VIDEO_PROXY_BASE_URL}/api/video/play/${token}`;
  }

  // نسخة اختيارية إذا أردت endpoint لإنشاء token من request body
  static async createFromBody(body: unknown) {
    let parsed: any;
    try {
      parsed = createVideoTokenSchema.parse(body);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    return this.createVideoToken(
      parsed.sessionId,
      parsed.videoUrl,
      parsed.userId
    );
  }

  // أهم تحسين: استهلاك التوكن بشكل ذري (Atomic) لمنع الاستخدام المزدوج
  static async verifyAndUseToken(token: string) {

    console.log('here')

    let parsed: any;
    try {
      parsed = playVideoSchema.parse({ token });
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const now = new Date();

    // consume: لا ينجح إلا إذا:
    // - موجود
    // - غير مستخدم
    // - غير منتهي
    const doc = await VideoToken.findOneAndUpdate(
      { token: parsed.token, used: false, expiresAt: { $gt: now } },
      { $set: { used: true } },
      { new: true }
    );

    console.log(doc);

    if (!doc) {
      // نفس رسائلك تقريباً لكن أوضح
      throw notFound("الرابط غير صالح أو منتهي الصلاحية");
    }

    const signedUrl = generateBunnySignedIframeUrl(
      doc.libraryId,
      doc.videoId,
      SIGNED_IFRAME_TTL_SECONDS
    );

    return { videoUrl: signedUrl, sessionId: doc.sessionId.toString() };
  }
}
