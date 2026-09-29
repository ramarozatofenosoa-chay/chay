import assert from "node:assert/strict";
import test from "node:test";
import { getBackFallback } from "./backNavigation.js";

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
