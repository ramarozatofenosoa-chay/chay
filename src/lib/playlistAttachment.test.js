import assert from "node:assert/strict";
import test from "node:test";
import { buildPlaylistTrackRecord, savePlaylistTrack } from "./playlistAttachment.js";

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

test("saves the selected playlist relation directly without a lookup", async () => {
  const calls = [];
  const entity = {
    async create(record) {
      calls.push(["create", record]);
      return { ...record, id: "playlist-track-1" };
    },
    async update() {
      calls.push(["update"]);
      throw new Error("No update should be needed");
    },
  };
  const record = {
    playlist_id: "playlist-1",
    track_id: "track-1",
    title: "Song",
    audio_url: "https://cdn.example/song.mp3",
  };

  const saved = await savePlaylistTrack(entity, record, "audio_url");

  assert.equal(saved.id, "playlist-track-1");
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
  const entity = {
    async create() {
      return { id: updatedRecord.id };
    },
    async update(id, fields) {
      assert.equal(id, updatedRecord.id);
      assert.deepEqual(fields, {
        playlist_id: updatedRecord.playlist_id,
        track_id: updatedRecord.track_id,
        title: updatedRecord.title,
        video_url: updatedRecord.video_url,
      });
      return updatedRecord;
    },
  };

  assert.deepEqual(await savePlaylistTrack(entity, updatedRecord, "video_url"), updatedRecord);
});
