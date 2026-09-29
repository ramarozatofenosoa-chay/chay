import test from "node:test";
import assert from "node:assert/strict";
import {
  registerMediaControl,
  publishMediaControl,
  requestMediaPlayback,
  stopActiveMediaControl,
  subscribeMediaControl,
  subscribeMediaPlaybackRequests,
  updateMediaControl,
} from "./mediaControl.js";

test("registered media control is published and removed by its disposer", () => {
  let latest;
  const unsubscribe = subscribeMediaControl((control) => { latest = control; });
  const dispose = registerMediaControl({
    type: "film",
    title: "Un film",
    isPlaying: true,
    toggle() {},
    stop() {},
  });

  assert.equal(latest.title, "Un film");
  dispose();
  assert.equal(latest, null);
  unsubscribe();
});

test("stopActiveMediaControl invokes stop and clears the active control", () => {
  let latest;
  let stopped = false;
  const unsubscribe = subscribeMediaControl((control) => { latest = control; });
  registerMediaControl({
    type: "radio",
    title: "Radio",
    isPlaying: true,
    toggle() {},
    stop() { stopped = true; },
  });

  stopActiveMediaControl();
  assert.equal(stopped, true);
  assert.equal(latest, null);
  unsubscribe();
});

test("a new playing media item replaces and stops the previous media owner", () => {
  let latest;
  let previousStopped = 0;
  const unsubscribe = subscribeMediaControl((control) => { latest = control; });
  const audioId = publishMediaControl({
    type: "audio",
    title: "Song",
    isPlaying: true,
    stop() { previousStopped += 1; },
  }, "audio");

  const videoId = publishMediaControl({
    type: "video",
    title: "Film",
    isPlaying: true,
    stop() {},
  }, "video");

  assert.equal(previousStopped, 1);
  assert.equal(latest.id, videoId);
  assert.notEqual(latest.id, audioId);
  stopActiveMediaControl();
  assert.equal(latest, null);
  unsubscribe();
});

test("media requests reach the persistent player surface immediately", () => {
  let received;
  let latest;
  const unsubscribe = subscribeMediaPlaybackRequests((control) => { received = control; });
  const unsubscribeState = subscribeMediaControl((control) => { latest = control; });
  const id = requestMediaPlayback({
    type: "youtube",
    title: "Culte",
    source: "youtube-id",
    isPlaying: true,
    stop() {},
  }, "youtube");

  assert.equal(received.id, id);
  assert.equal(received.source, "youtube-id");
  updateMediaControl(id, { currentTime: 12, duration: 90 });
  assert.equal(latest.currentTime, 12);
  unsubscribe();
  unsubscribeState();
  stopActiveMediaControl();
});
