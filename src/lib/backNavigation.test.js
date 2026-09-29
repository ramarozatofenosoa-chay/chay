import assert from "node:assert/strict";
import test from "node:test";
import {
  createOverlayHistoryState,
  hasInAppHistory,
  hasNavigationOrigin,
  OVERLAY_HISTORY_KEY,
} from "./backNavigation.js";

test("overlay history entries preserve React Router state and advance its index", () => {
  const state = createOverlayHistoryState({ usr: { from: "/media" }, key: "route-1", idx: 4 });

  assert.deepEqual(state, {
    usr: { from: "/media" },
    key: "route-1",
    idx: 5,
    [OVERLAY_HISTORY_KEY]: true,
  });
});

test("overlay history entries start at index one when there is no router state", () => {
  assert.equal(createOverlayHistoryState(null).idx, 1);
});

test("detects whether the current route has an in-app back entry", () => {
  assert.equal(hasInAppHistory({ idx: 1 }), true);
  assert.equal(hasInAppHistory({ idx: 0 }), false);
  assert.equal(hasInAppHistory({}), false);
});

test("only pops a nested view when it was opened from its parent view", () => {
  assert.equal(
    hasNavigationOrigin({ usr: { chayMediaCategory: true } }, "chayMediaCategory"),
    true
  );
  assert.equal(
    hasNavigationOrigin({ usr: { other: true } }, "chayMediaCategory"),
    false
  );
});
