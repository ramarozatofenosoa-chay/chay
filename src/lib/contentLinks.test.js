import assert from "node:assert/strict";
import test from "node:test";
import { getContentMediaPath } from "./contentLinks.js";

test("playlist-backed music links identify both playlist and exact track", () => {
  assert.equal(
    getContentMediaPath({
      type: "audio",
      resource_type: "MusicTrack",
      resource_id: "track 1",
      playlist_id: "playlist/2",
    }),
    "/media?cat=music&track=track+1&playlist=playlist%2F2"
  );
});

test("legacy multimedia types resolve to their exact media view", () => {
  assert.equal(
    getContentMediaPath({ type: "predication", resource_id: "sermon-id" }),
    "/media?cat=sermons&track=sermon-id"
  );
  assert.equal(
    getContentMediaPath({ type: "video", resource_id: "film-id" }),
    "/media?cat=films&track=film-id"
  );
  assert.equal(
    getContentMediaPath({
      type: "video",
      resource_type: "YouTubeVideo",
      resource_id: "youtube-id",
    }),
    "/media?cat=youtube&video=youtube-id"
  );
  assert.equal(
    getContentMediaPath({ type: "youtube", resource_id: "youtube-id" }),
    "/media?cat=youtube&video=youtube-id"
  );
  assert.equal(
    getContentMediaPath({ type: "article", resource_id: "article-id" }),
    "/media?cat=articles&article=article-id"
  );
  assert.equal(
    getContentMediaPath({ type: "gallery", resource_id: "image-id" }),
    "/media?cat=gallery&image=image-id"
  );
});

test("unsupported or unlinked content keeps its in-app detail fallback", () => {
  assert.equal(getContentMediaPath({ type: "annonce", resource_id: "announcement-id" }), null);
  assert.equal(getContentMediaPath({ type: "audio" }), null);
});
