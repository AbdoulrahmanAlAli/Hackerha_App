import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export function generateBunnySignedIframeUrl(iframeUrl: string): string {
  const SECURITY_KEY = process.env.BUNNY_SECURITY_KEY!;
  // هذا هو Token Authentication Key من صفحة Stream Library

  const url = new URL(iframeUrl);

  // /play/558924/7147da37-b2ba-41b2-b20f-b601e9a8c7ae
  const segments = url.pathname.split("/").filter(Boolean);
  // segments[0] = "play"
  // segments[1] = libraryId
  // segments[2] = videoId

  const libraryId = segments[1];
  const videoId = segments[2];

  // صلاحية الرابط: 3 ثواني فقط
  const expires = Math.floor(Date.now() / 1000) + 8;

  // حسب توثيق Bunny Stream:
  // SHA256_HEX(token_security_key + video_id + expiration)
  const token = crypto
    .createHash("sha256")
    .update(SECURITY_KEY + videoId + expires)
    .digest("hex");

  // نرجّع رابط /play موقّع
  return `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}?expires=${expires}&token=${token}`;
}
