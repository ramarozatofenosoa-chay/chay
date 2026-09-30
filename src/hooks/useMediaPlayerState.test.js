import assert from "node:assert/strict";
import test from "node:test";
import { MEDIA_PLAYER_BUFFERING_POLICY } from "../hooks/useMediaPlayerState.js";

test("buffering policy keeps a larger cushion before playback begins or is considered stalled", () => {
  assert.ok(MEDIA_PLAYER_BUFFERING_POLICY.defaultErrorTimeoutMs >= 30000);
  assert.ok(MEDIA_PLAYER_BUFFERING_POLICY.radioPrerollMinBufferSeconds >= 6);
  assert.ok(MEDIA_PLAYER_BUFFERING_POLICY.radioPrerollMaxMs >= 15000);
  assert.ok(MEDIA_PLAYER_BUFFERING_POLICY.radioStallMs >= 40000);
});
