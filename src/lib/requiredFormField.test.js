import assert from "node:assert/strict";
import test from "node:test";
import { findMissingRequiredField } from "./requiredFormField.js";

test("requires an explicit playlist selection before saving an upload", () => {
  const fields = [
    { name: "playlist_id", label: "Playlist", required: true },
    { name: "title", label: "Titre", required: true },
  ];

  assert.equal(
    findMissingRequiredField(fields, { playlist_id: "", title: "Song" }),
    fields[0]
  );
  assert.equal(
    findMissingRequiredField(fields, { playlist_id: "playlist-1", title: "Song" }),
    undefined
  );
});

test("does not treat zero as a missing required value", () => {
  assert.equal(
    findMissingRequiredField([{ name: "duration", required: true }], { duration: 0 }),
    undefined
  );
});
