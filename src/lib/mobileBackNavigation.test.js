import assert from "node:assert/strict";
import test from "node:test";
import { getBackAction, getBackFallback } from "./backNavigation.js";

test("native back minimizes the app at its root while media is playing", () => {
  assert.equal(
    getBackAction({ hasOverlay: false, hasHistory: false, isNative: true, isPlaying: true }),
    "minimize-app"
  );
});

test("overlays and app history take precedence over minimizing", () => {
  assert.equal(
    getBackAction({ hasOverlay: true, hasHistory: true, isNative: true, isPlaying: true }),
    "close-overlay"
  );
  assert.equal(
    getBackAction({ hasOverlay: false, hasHistory: true, isNative: true, isPlaying: true }),
    "navigate-back"
  );
});

test("non-native and paused root back actions use the in-app fallback", () => {
  assert.equal(
    getBackAction({ hasOverlay: false, hasHistory: false, isNative: false, isPlaying: true }),
    "fallback"
  );
  assert.equal(
    getBackAction({ hasOverlay: false, hasHistory: false, isNative: true, isPlaying: false }),
    "fallback"
  );
});

test("directly opened nested screens fall back to their parent screen", () => {
  assert.equal(getBackFallback("/media", "?cat=music&track=track-1"), "/media");
  assert.equal(getBackFallback("/bible", "?view=reader&ref=John+3"), "/bible");
  assert.equal(getBackFallback("/messages", "?c=conversation-1"), "/messages");
  assert.equal(getBackFallback("/games", "?game=trivia"), "/games");
});

test("top-level and unrelated routes fall back to Home", () => {
  assert.equal(getBackFallback("/", ""), "/");
  assert.equal(getBackFallback("/settings", ""), "/");
});
