import assert from "node:assert/strict";
import test from "node:test";
import { lookupWord, lookupPhrase } from "./bibleConcordance.js";

// Index synthétique au format réel des fichiers générés par
// scripts/build-bible-index.mjs (livres 0..2, versets plats, postings).
const INDEX = {
  lang: "fr",
  books: [
    { id: "GEN", name: "Genèse", chapters: 1 },
    { id: "JHN", name: "Jean", chapters: 3 },
  ],
  verses: [
    [0, 1, 1, "Au commencement Dieu créa les cieux et la terre."],
    [1, 3, 16, "Car Dieu a tant aimé le monde qu'il a donné son Fils unique."],
    [1, 1, 1, "Généalogie de Jésus-Christ, fils de David."],
  ],
  index: {
    au: [0],
    commencement: [0],
    dieu: [0, 1],
    créa: [0],
    les: [0],
    cieux: [0],
    et: [0, 2],
    la: [0],
    terre: [0],
    car: [1],
    a: [1],
    tant: [1],
    aimé: [1],
    le: [1],
    monde: [1],
    "qu'il": [1],
    donné: [1],
    son: [1],
    fils: [1, 2],
    unique: [1],
    généalogie: [2],
    "jésus-christ": [2],
    david: [2],
  },
};

test("lookupWord trouve un mot très court (« a ») sans minimum de longueur", () => {
  const { total, entries } = lookupWord(INDEX, "a");
  assert.equal(total, 1);
  assert.equal(entries[0].chapter, 3);
  assert.equal(entries[0].verse, 16);
});

test("lookupWord est insensible à la casse", () => {
  assert.equal(lookupWord(INDEX, "Dieu").total, 2);
  assert.equal(lookupWord(INDEX, "DIEU").total, 2);
});

test("lookupWord tolère l'absence d'accents en français", () => {
  // « crea » doit trouver « créa » (clé accentuée) via l'accent folding.
  assert.equal(lookupWord(INDEX, "crea").total, 1);
  assert.equal(lookupWord(INDEX, "créa").total, 1);
});

test("lookupWord ne correspond pas à l'intérieur d'un autre mot", () => {
  // « fils » existe, mais « il » (intérieur de « fils », absent de l'index)
  // ne doit rien trouver ; « es » n'est pas indexé → 0.
  assert.equal(lookupWord(INDEX, "il").total, 0);
  assert.equal(lookupWord(INDEX, "es").total, 0);
  assert.equal(lookupWord(INDEX, "fils").total, 2);
});

test("lookupWord paginate avec offset/limit", () => {
  const p1 = lookupWord(INDEX, "dieu", { offset: 0, limit: 1 });
  const p2 = lookupWord(INDEX, "dieu", { offset: 1, limit: 1 });
  assert.equal(p1.total, 2);
  assert.equal(p1.entries.length, 1);
  assert.equal(p2.entries.length, 1);
  assert.notEqual(p1.entries[0].text, p2.entries[0].text);
});

test("lookupPhrase exige tous les mots dans le même verset", () => {
  assert.equal(lookupPhrase(INDEX, "dieu a").total, 1); // Jean 3:16
  assert.equal(lookupPhrase(INDEX, "dieu genseric").total, 0);
  assert.equal(lookupPhrase(INDEX, "unique").total, 1); // mono-mot → lookupWord
});

test("lookupPhrase ignore la ponctuation collée et respecte les mots entiers", () => {
  // « Jésus-Christ » est un seul token indexé ; « christ » seul n'y correspond pas.
  assert.equal(lookupPhrase(INDEX, "jésus-christ").total, 1);
  assert.equal(lookupPhrase(INDEX, "christ").total, 0);
});

test("requête vide ou sans mot = aucun résultat", () => {
  assert.deepEqual(lookupWord(INDEX, "  "), { total: 0, entries: [] });
  assert.deepEqual(lookupPhrase(INDEX, "..."), { total: 0, entries: [] });
});
