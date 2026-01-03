import crypto from "crypto";
import { badRequest } from "../../core/errors/httpErrors";

export function generateBunnySignedIframeUrl(
  libraryId: string,
  videoId: string,
  ttlSeconds = 8
): string {
  const SECURITY_KEY = process.env.BUNNY_SECURITY_KEY;
  if (!SECURITY_KEY) throw badRequest("BUNNY_SECURITY_KEY غير موجود");

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;

  // Bunny Token Auth: SHA256_HEX(securityKey + videoId + expires)
  const token = crypto
    .createHash("sha256")
    .update(SECURITY_KEY + videoId + expires)
    .digest("hex");

  return `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}?expires=${expires}&token=${token}`;
}
