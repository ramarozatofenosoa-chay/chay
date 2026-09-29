export const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";
export const YOUTUBE_REFERRER_POLICY = "origin";

export function buildYouTubeEmbedUrl(videoId, pageOrigin) {
  if (!videoId || !pageOrigin || pageOrigin === "null") return null;

  const url = new URL(`/embed/${encodeURIComponent(videoId)}`, YOUTUBE_ORIGIN);
  url.search = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    enablejsapi: "1",
    origin: pageOrigin,
  }).toString();
  return url.toString();
}
