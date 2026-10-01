import assert from "node:assert/strict";
import test from "node:test";
import { matchOfflineVerses, pickChapterVerses, groupVersesByChapter } from "./offlineBibleSearch.js";

const INDEX = [
  { book: "Jean", bookOrder: 43, chapter: 3, verse: 16, text: "Car Dieu a tant aimé le monde", normalizedText: "car dieu a tant aime le monde" },
  { book: "Jean", bookOrder: 43, chapter: 3, verse: 17, text: "Dieu n'a pas envoyé son Fils", normalizedText: "dieu n a pas envoye son fils" },
  { book: "Genèse", bookOrder: 1, chapter: 1, verse: 1, text: "Au commencement Dieu créa", normalizedText: "au commencement dieu crea" },
];

test("matchOfflineVerses returns an empty result for too-short queries", () => {
  assert.deepEqual(matchOfflineVerses(INDEX, { query: "d", translation: "lsg1910" }), {
    total: 0,
    items: [],
    hasMore: false,
  });
});

test("matchOfflineVerses finds matches across all books by default", () => {
  const res = matchOfflineVerses(INDEX, { query: "Dieu", translation: "lsg1910" });
  assert.equal(res.total, 3);
  assert.equal(res.items.length, 3);
  // Tri attendu : bookOrder, puis chapitre, puis verset.
  assert.deepEqual(
    res.items.map((i) => `${i.bookOrder}:${i.chapter}:${i.verse}`),
    ["1:1:1", "43:3:16", "43:3:17"]
  );
});

test("matchOfflineVerses restricts to a single book via bookOrder", () => {
  const res = matchOfflineVerses(INDEX, { query: "Dieu", translation: "lsg1910", bookOrder: 43 });
  assert.equal(res.total, 2);
  assert.ok(res.items.every((i) => i.bookOrder === 43));
});

test("matchOfflineVerses paginates with limit/offset and reports hasMore", () => {
  const res = matchOfflineVerses(INDEX, { query: "Dieu", translation: "lsg1910", limit: 1, offset: 0 });
  assert.equal(res.total, 3);
  assert.equal(res.items.length, 1);
  assert.equal(res.hasMore, true);

  const last = matchOfflineVerses(INDEX, { query: "Dieu", translation: "lsg1910", limit: 1, offset: 2 });
  assert.equal(last.items.length, 1);
  assert.equal(last.hasMore, false);
});

test("matchOfflineVerses handles a missing/invalid index gracefully", () => {
  assert.deepEqual(matchOfflineVerses(null, { query: "Dieu" }), { total: 0, items: [], hasMore: false });
  assert.deepEqual(matchOfflineVerses(undefined, { query: "Dieu" }), { total: 0, items: [], hasMore: false });
});

test("pickChapterVerses extracts and sorts a chapter's verses", () => {
  const flat = [
    { bookOrder: 43, chapter: 3, verse: 17, text: "b" },
    { bookOrder: 43, chapter: 3, verse: 16, text: "a" },
    { bookOrder: 1, chapter: 1, verse: 1, text: "ignored" },
  ];
  assert.deepEqual(pickChapterVerses(flat, 43, 3), [
    { number: 16, text: "a" },
    { number: 17, text: "b" },
  ]);
});

test("pickChapterVerses returns an empty array when given a non-array input", () => {
  assert.deepEqual(pickChapterVerses(null, 1, 1), []);
});

test("groupVersesByChapter groups and sorts verses by bookOrder:chapter key", () => {
  const flat = [
    { bookOrder: 43, chapter: 3, verse: 17, text: "b" },
    { bookOrder: 43, chapter: 3, verse: 16, text: "a" },
    { bookOrder: 1, chapter: 1, verse: 1, text: "c" },
  ];
  const grouped = groupVersesByChapter(flat);
  assert.deepEqual(grouped.get("43:3"), [
    { number: 16, text: "a" },
    { number: 17, text: "b" },
  ]);
  assert.deepEqual(grouped.get("1:1"), [{ number: 1, text: "c" }]);
});

test("groupVersesByChapter handles an empty/undefined input", () => {
  assert.equal(groupVersesByChapter(undefined).size, 0);
  assert.equal(groupVersesByChapter([]).size, 0);
});
