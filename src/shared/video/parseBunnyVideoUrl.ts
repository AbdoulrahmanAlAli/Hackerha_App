import { badRequest } from "../../core/errors/httpErrors";

export function parseBunnyVideoUrl(videoUrl: string): {
  libraryId: string;
  videoId: string;
} {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    throw badRequest("رابط الفيديو غير صالح");
  }

  // نقبل روابط مثل:
  // https://iframe.mediadelivery.net/play/{libraryId}/{videoId}
  // أو أي رابط يحتوي /play/{libraryId}/{videoId}
  const parts = url.pathname.split("/").filter(Boolean);
  const playIndex = parts.indexOf("play");
  if (playIndex === -1 || !parts[playIndex + 1] || !parts[playIndex + 2]) {
    throw badRequest("رابط Bunny غير صالح");
  }

  const libraryId = parts[playIndex + 1];
  const videoId = parts[playIndex + 2];

  return { libraryId, videoId };
}
