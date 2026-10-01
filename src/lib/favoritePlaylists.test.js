import test from "node:test";
import assert from "node:assert/strict";
import { groupMusicFavorites } from "./favoritePlaylists.js";

test("groups music favorites by their source playlist and preserves order", () => {
  const groups = groupMusicFavorites([
    { id: "b2", track_id: "same", category: "music", source_playlist_id: "b", source_playlist_name: "B", playlist_order: 1, order: 1 },
    { id: "a1", track_id: "same", category: "music", source_playlist_id: "a", source_playlist_name: "A", playlist_order: 0, order: 0 },
    { id: "b1", track_id: "other", category: "music", source_playlist_id: "b", source_playlist_name: "B", playlist_order: 1, order: 0 },
    { id: "film", category: "films", kind: "video", source_playlist_id: "c" },
  ]);

  assert.deepEqual(groups.map((group) => group.id), ["a", "b"]);
  assert.deepEqual(groups[1].items.map((item) => item.id), ["b1", "b2"]);
  assert.equal(groups[0].items[0].track_id, groups[1].items[1].track_id);
});

test("keeps legacy music favorites in one fallback playlist", () => {
  const groups = groupMusicFavorites([
    { id: "1", category: "music", title: "First" },
    { id: "2", category: "music", title: "Second" },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].id, "legacy-favorites");
  assert.deepEqual(groups[0].items.map((item) => item.id), ["1", "2"]);
});
