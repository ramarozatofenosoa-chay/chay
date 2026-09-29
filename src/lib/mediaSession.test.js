import test from "node:test";
import assert from "node:assert/strict";
import { syncMediaSessionActions } from "./mediaSession.js";

function createSession() {
  const handlers = new Map();
  return {
    handlers,
    setActionHandler(action, handler) {
      handlers.set(action, handler);
    },
  };
}

test("system media actions control current playback and navigate its queue", () => {
  const session = createSession();
  const calls = [];
  const controlRef = {
    current: {
      isPlaying: true,
      toggle: () => calls.push("toggle"),
      stop: () => calls.push("stop"),
      previous: () => calls.push("previous"),
      next: () => calls.push("next"),
      seek: (time) => calls.push(`seek:${time}`),
      currentTime: 25,
      duration: 100,
    },
  };

  syncMediaSessionActions(session, controlRef);
  session.handlers.get("pause")();
  session.handlers.get("previoustrack")();
  session.handlers.get("nexttrack")();
  session.handlers.get("seekbackward")({ seekOffset: 10 });
  session.handlers.get("seekforward")({ seekOffset: 10 });
  session.handlers.get("seekto")({ seekTime: 55 });

  assert.deepEqual(calls, [
    "toggle",
    "previous",
    "next",
    "seek:15",
    "seek:35",
    "seek:55",
  ]);
});

test("system previous/next controls are hidden when queue items are unavailable", () => {
  const session = createSession();
  syncMediaSessionActions(session, { current: { isPlaying: false } });

  assert.equal(session.handlers.get("previoustrack"), null);
  assert.equal(session.handlers.get("nexttrack"), null);
});

test("radio system play resumes the stream and pause stops it", () => {
  const session = createSession();
  const calls = [];
  const controlRef = {
    current: {
      type: "radio",
      isPlaying: true,
      play: () => calls.push("play"),
      stop: () => calls.push("stop"),
    },
  };

  syncMediaSessionActions(session, controlRef);
  session.handlers.get("play")();
  session.handlers.get("pause")();

  assert.deepEqual(calls, ["play", "stop"]);
});
