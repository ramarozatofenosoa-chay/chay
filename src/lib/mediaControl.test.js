import test from "node:test";
import assert from "node:assert/strict";
import {
  registerMediaControl,
  stopActiveMediaControl,
  subscribeMediaControl,
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
