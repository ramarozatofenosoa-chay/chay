import assert from "node:assert/strict";
import test from "node:test";
import { isValidPlaylistImageUrl } from "./playlist.js";

test("requires a public HTTP image URL for a playlist cover", () => {
  assert.equal(isValidPlaylistImageUrl("https://cdn.example/playlist.jpg"), true);
  assert.equal(isValidPlaylistImageUrl("http://cdn.example/playlist.png"), true);
  assert.equal(isValidPlaylistImageUrl(""), false);
  assert.equal(isValidPlaylistImageUrl(null), false);
  assert.equal(isValidPlaylistImageUrl("blob:playlist-image"), false);
  assert.equal(isValidPlaylistImageUrl("data:image/jpeg;base64,abc"), false);
});
