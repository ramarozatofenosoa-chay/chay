// Génère les index de concordance inversés (FR + MG) à partir des fichiers
// bibliques réels de public/data/bibles, et écrit le résultat dans
// public/data/concordance/. À relancer uniquement si les textes sources
// changent : les fichiers produits sont statiques et donc utilisables hors
// ligne une fois l'application installée/mise en cache.
//
// Format produit (par langue) :
// {
//   lang, source, title, builtAt, verseCount, wordCount,
//   books: [{ id, name, chapters }],           // ordre canonique 1..66
//   verses: [[bookIdx, chapter, verse, text]], // tableau plat compact
//   index: { motNormalise: [idxVerse...], }    // postings triés par index
// }
// Règles d'indexation : tous les mots sont indexés (aucune liste de mots
// vides, aucune longueur minimale). Un mot = suite de lettres Unicode
// éventuellement interne avec apostrophes/traits d'union ("Jésus-Christ",
// "n'a" -> ["n'a"]). Clé = minuscules NFC, accents conservés ; la recherche
// côté client normalise la saisie de la même façon (casse + variantes
// accentuées gérées localement).

import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public/data/concordance");

const SOURCES = [
  { lang: "fr", file: "lsg1910_fr_CORRIGE.json" },
  { lang: "mg", file: "malagasy_complete.json" },
];

const WORD_RE = /[\p{L}]+(?:['’-][\p{L}]+)*/gu;

export function tokenize(text) {
  return text.match(WORD_RE) || [];
}

export function keyOf(word) {
  return word.toLowerCase();
}

function buildFor({ lang, file }) {
  const raw = JSON.parse(readFileSync(join(ROOT, "public/data/bibles", file), "utf8"));
  const booksFlat = [...raw.testament.OT.books, ...raw.testament.NT.books];

  const books = booksFlat.map((b) => ({
    id: b.book_id,
    name: b.book_name,
    chapters: b.chapters.length,
  }));

  const verses = [];
  const postings = new Map();

  booksFlat.forEach((b, bookIdx) => {
    for (const ch of b.chapters) {
      for (const v of ch.verses) {
        const text = String(v.text || "").replace(/\s+/g, " ").trim();
        if (!text) continue;
        const verseIdx = verses.length;
        verses.push([bookIdx, ch.chapter, v.verse, text]);
        for (const w of tokenize(text)) {
          const k = keyOf(w);
          let set = postings.get(k);
          if (!set) postings.set(k, (set = new Set()));
          set.add(verseIdx);
        }
      }
    }
  });

  const index = {};
  for (const [k, set] of [...postings.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    index[k] = Array.from(set).sort((a, b) => a - b);
  }

  return {
    lang,
    source: `data/bibles/${file}`,
    title: raw.title,
    builtAt: new Date().toISOString(),
    verseCount: verses.length,
    wordCount: postings.size,
    books,
    verses,
    index,
  };
}

// Exécution directe : npm run build:bible-index
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const src of SOURCES) {
    const out = buildFor(src);
    const outFile = join(OUT_DIR, `concordance-${out.lang}.json`);
    writeFileSync(outFile, JSON.stringify(out));
    console.log(
      `${outFile} — ${out.verseCount} versets, ${out.wordCount} mots distincts, ${statSync(outFile).size} octets`
    );
  }
}
