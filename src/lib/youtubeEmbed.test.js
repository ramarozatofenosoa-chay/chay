import test from "node:test";
import assert from "node:assert/strict";
import {
  buildYouTubeEmbedUrl,
  YOUTUBE_ORIGIN,
  YOUTUBE_REFERRER_POLICY,
} from "./youtubeEmbed.js";

test("YouTube embed URLs include the app origin and player API parameters", () => {
  const url = new URL(buildYouTubeEmbedUrl("abcdefghijk", "https://chay.base44.app"));

  assert.equal(url.origin, YOUTUBE_ORIGIN);
  assert.equal(url.pathname, "/embed/abcdefghijk");
  assert.equal(url.searchParams.get("origin"), "https://chay.base44.app");
  assert.equal(url.searchParams.get("enablejsapi"), "1");
  assert.equal(url.searchParams.get("autoplay"), "1");
  assert.equal(YOUTUBE_REFERRER_POLICY, "origin");
});

test("YouTube embed URL is omitted when a usable app origin is unavailable", () => {
  assert.equal(buildYouTubeEmbedUrl("abcdefghijk", "null"), null);
  assert.equal(buildYouTubeEmbedUrl("abcdefghijk", ""), null);
});
