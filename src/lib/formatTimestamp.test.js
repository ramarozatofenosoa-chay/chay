import test from "node:test";
import assert from "node:assert/strict";
import { formatTimestamp, parseTimestamp } from "./formatTimestamp.js";

test("naive ISO timestamps are interpreted consistently as UTC instants", () => {
  assert.equal(
    parseTimestamp("2026-10-01T09:00:00").toISOString(),
    "2026-10-01T09:00:00.000Z"
  );
});

test("formats persisted timestamps using the viewer's local timezone", () => {
  const original = Date.prototype.toLocaleString;
  let options;
  Date.prototype.toLocaleString = function (locale, value) {
    options = { locale, value };
    return "01 oct., 11:00";
  };
  try {
    assert.equal(formatTimestamp("2026-10-01T09:00:00Z"), "01 oct., 11:00");
    assert.equal(options.locale, "fr-FR");
    assert.deepEqual(options.value, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } finally {
    Date.prototype.toLocaleString = original;
  }
});

test("supports date-only and time-only labels and ignores invalid values", () => {
  assert.equal(formatTimestamp("not-a-date"), "");
  assert.equal(formatTimestamp(null), "");

  const original = Date.prototype.toLocaleString;
  const options = [];
  Date.prototype.toLocaleString = function (_locale, value) {
    options.push(value);
    return "formatted";
  };
  try {
    assert.equal(formatTimestamp("2026-10-01T09:00:00Z", { date: false }), "formatted");
    assert.equal(formatTimestamp("2026-10-01T09:00:00Z", { time: false }), "formatted");
    assert.deepEqual(options, [
      { hour: "2-digit", minute: "2-digit" },
      { day: "numeric", month: "short" },
    ]);
  } finally {
    Date.prototype.toLocaleString = original;
  }
});
