// Logique pure (sans réseau ni cache) de recherche plein texte hors-ligne,
// répliquant exactement l'algorithme du backend `searchBibleVerses` afin que
// la concordance se comporte à l'identique en ligne et hors-ligne.
import { normalizeSearchText } from "./bibleSearch.js";

// `index` : tableau de versets { book, bookOrder, chapter, verse, text, normalizedText }
// déjà normalisés (voir offlineBible.getOfflineSearchIndex).
export function matchOfflineVerses(index, { query, translation, bookOrder = 0, limit = 20, offset = 0 } = {}) {
  const trimmed = String(query || "").trim().replace(/\s+/g, " ");
  if (!Array.isArray(index) || trimmed.replace(/\s/g, "").length < 2) {
    return { total: 0, items: [], hasMore: false };
  }
  const language = translation === "malagasy" ? "mg" : "fr";
  const normalizedQuery = normalizeSearchText(trimmed, language);
  if (!normalizedQuery) return { total: 0, items: [], hasMore: false };

  const matches = [];
  for (const v of index) {
    if (bookOrder && v.bookOrder !== bookOrder) continue;
    if (v.normalizedText && v.normalizedText.includes(normalizedQuery)) {
      matches.push({
        translation,
        book: v.book,
        bookOrder: v.bookOrder,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
      });
    }
  }
  matches.sort((a, b) => a.bookOrder - b.bookOrder || a.chapter - b.chapter || a.verse - b.verse);

  const total = matches.length;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const items = matches.slice(safeOffset, safeOffset + safeLimit);
  const hasMore = safeOffset + safeLimit < total;
  return { total, items, hasMore };
}

// Reconstitue les versets d'un chapitre (forme attendue par BibleReader :
// [{ number, text }] trié) à partir d'un tableau plat de BibleVerse.
export function pickChapterVerses(flatVerses, bookOrder, chapter) {
  if (!Array.isArray(flatVerses)) return [];
  return flatVerses
    .filter((v) => v.bookOrder === bookOrder && v.chapter === chapter)
    .map((v) => ({ number: v.verse, text: v.text }))
    .sort((a, b) => a.number - b.number);
}

// Regroupe un tableau plat de BibleVerse par clé `bookOrder:chapter`, pour
// préparer l'écriture en masse dans le cache par chapitre.
export function groupVersesByChapter(flatVerses) {
  const grouped = new Map();
  for (const v of flatVerses || []) {
    const key = `${v.bookOrder}:${v.chapter}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ number: v.verse, text: v.text });
  }
  for (const verses of grouped.values()) verses.sort((a, b) => a.number - b.number);
  return grouped;
}
