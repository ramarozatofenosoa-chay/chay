import test from "node:test";
import assert from "node:assert/strict";
import { getHomeContentMessage } from "./homeContentMessage.js";

test("home activity messages use the requested French wording for media types", () => {
  const cases = [
    ["audio", 'La chanson "Titre" a été ajoutée récemment.'],
    ["predication", 'La prédication "Titre" a été ajoutée récemment.'],
    ["video", 'Le film "Titre" a été ajouté récemment.'],
    ["youtube", 'La vidéo YouTube "Titre" a été ajoutée récemment.'],
    ["article", 'L\'article "Titre" a été ajoutée récemment.'],
    ["gallery", "Une nouvelle photo a été ajoutée dans la galerie."],
  ];
  for (const [type, expected] of cases) {
    assert.equal(getHomeContentMessage({ type, title: "Titre", category: "Ignored" }), expected);
  }
});

test("unknown activity types receive a useful fallback", () => {
  assert.equal(
    getHomeContentMessage({ type: "event", title: "Assemblée" }),
    'Un nouveau contenu "Assemblée" a été ajouté récemment.'
  );
});
