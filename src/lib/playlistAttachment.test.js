import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPlaylistTrackRecord,
  resolveSelectedPlaylistId,
  savePlaylistTrack,
} from "./playlistAttachment.js";

test("builds a playlist attachment from a saved audio item", () => {
  const record = buildPlaylistTrackRecord({
    entity: "MusicTrack",
    playlistId: "playlist-1",
    item: {
      id: "track-1",
      title: "Saved title",
      artist: "Artist",
      audio_url: "https://cdn.example/track.mp3",
    },
  });

  assert.deepEqual(
    { ...record, order: undefined },
    {
      playlist_id: "playlist-1",
      track_id: "track-1",
      title: "Saved title",
      artist: "Artist",
      audio_url: "https://cdn.example/track.mp3",
      video_url: null,
      cover_url: null,
      kind: "audio",
      order: undefined,
    }
  );
  assert.ok(Number.isFinite(record.order));
});

test("keeps uploaded media URLs when the entity create response omits them", () => {
  const record = buildPlaylistTrackRecord({
    entity: "Video",
    playlistId: "playlist-2",
    item: { id: "video-1", title: "Message", video_url: null },
    submittedData: {
      title: "Uploaded title",
      video_url: "https://cdn.example/video.mp4",
      cover_url: "https://cdn.example/cover.jpg",
    },
  });

  assert.equal(record.track_id, "video-1");
  assert.equal(record.title, "Message");
  assert.equal(record.video_url, "https://cdn.example/video.mp4");
  assert.equal(record.cover_url, "https://cdn.example/cover.jpg");
  assert.equal(record.kind, "video");
  assert.equal(record.playlist_id, "playlist-2");
});

test("uses the configured cover field when building an attachment", () => {
  const record = buildPlaylistTrackRecord({
    entity: "MusicTrack",
    playlistId: "playlist-3",
    item: { id: "track-3", title: "Song", album_cover: "https://cdn.example/album.jpg" },
    coverField: "album_cover",
  });

  assert.equal(record.cover_url, "https://cdn.example/album.jpg");
});

test("requires both the saved item and selected playlist", () => {
  assert.throws(
    () => buildPlaylistTrackRecord({ entity: "MusicTrack", playlistId: "", item: { id: "track-1" } }),
    /playlist est requis/
  );
});

test("uses the playlist selected in the form as the authoritative submitted value", () => {
  assert.equal(resolveSelectedPlaylistId("selected-playlist", ""), "selected-playlist");
  assert.equal(resolveSelectedPlaylistId(null, "submitted-playlist"), "submitted-playlist");
  assert.equal(resolveSelectedPlaylistId("", "old-playlist"), "");
});

test("saves the selected playlist relation directly without a lookup", async () => {
  const calls = [];
  const record = {
    playlist_id: "playlist-1",
    track_id: "track-1",
    title: "Song",
    audio_url: "https://cdn.example/song.mp3",
  };
  let saved = null;
  const entity = {
    async filter(query) {
      assert.deepEqual(query, {
        track_id: record.track_id,
        playlist_id: record.playlist_id,
      });
      return saved ? [saved] : [];
    },
    async create(payload) {
      assert.deepEqual(payload, record);
      calls.push(["create", record]);
      saved = { ...record, id: "playlist-track-1" };
      return saved;
    },
    async update() {
      calls.push(["update"]);
      throw new Error("No update should be needed");
    },
  };

  const result = await savePlaylistTrack(entity, record, "audio_url");

  assert.equal(result.id, "playlist-track-1");
  assert.deepEqual(calls, [["create", record]]);
});

test("repairs fields omitted from create response and confirms persistence", async () => {
  const updatedRecord = {
    id: "playlist-track-2",
    playlist_id: "playlist-2",
    track_id: "video-2",
    title: "Video",
    video_url: "https://cdn.example/video.mp4",
  };
  let reads = 0;
  let persistedRecord = { id: updatedRecord.id };
  const entity = {
    async filter(query) {
      assert.deepEqual(query, {
        track_id: updatedRecord.track_id,
        playlist_id: updatedRecord.playlist_id,
      });
      reads += 1;
      return reads === 1 ? [] : [persistedRecord];
    },
    async create() {
      return { id: updatedRecord.id };
    },
    async get(id) {
      assert.equal(id, updatedRecord.id);
      return persistedRecord;
    },
    async update(id, fields) {
      assert.equal(id, updatedRecord.id);
      assert.deepEqual(fields, {
        playlist_id: updatedRecord.playlist_id,
        track_id: updatedRecord.track_id,
        title: updatedRecord.title,
        video_url: updatedRecord.video_url,
      });
      persistedRecord = updatedRecord;
      return updatedRecord;
    },
  };

  assert.deepEqual(await savePlaylistTrack(entity, updatedRecord, "video_url"), updatedRecord);
});

test("reuses an already-persisted relation instead of creating a duplicate on retry", async () => {
  const record = {
    playlist_id: "playlist-5",
    track_id: "track-5",
    title: "Song",
    audio_url: "https://cdn.example/song.mp3",
  };
  const persisted = { ...record, id: "relation-5" };
  let creates = 0;
  const entity = {
    async filter() {
      return [persisted];
    },
    async create() {
      creates += 1;
      return persisted;
    },
    async update() {
      throw new Error("No repair should be needed");
    },
  };

  assert.equal(
    await savePlaylistTrack(entity, record, "audio_url", {
      checkExisting: true,
    }),
    persisted
  );
  assert.equal(creates, 0);
});

test("waits for a newly-created relation to become visible before retrying", async () => {
  const record = {
    playlist_id: "playlist-6",
    track_id: "track-6",
    title: "Song",
    audio_url: "https://cdn.example/song.mp3",
  };
  let reads = 0;
  let creates = 0;
  const persisted = { ...record, id: "relation-6" };
  const entity = {
    async filter() {
      reads += 1;
      return reads < 3 ? [] : [persisted];
    },
    async create() {
      creates += 1;
    },
    async update() {
      throw new Error("No repair should be needed");
    },
  };

  assert.equal(
    await savePlaylistTrack(entity, record, "audio_url"),
    persisted
  );
  assert.equal(creates, 1);
  assert.equal(reads, 4);
});
