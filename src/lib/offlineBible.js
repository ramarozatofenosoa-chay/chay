// Orchestration du mode hors-ligne pour la Bible : télécharge et met en
// cache le texte biblique (FR + MG), le dictionnaire et sert d'index pour
// la concordance hors-ligne. S'appuie sur `offlineCache` (Cache Storage API)
// et sur l'entité BibleVerse déjà synchronisée côté admin (cf.
// base44/functions/syncBibleTranslation).
import { base44 } from "@/api/base44Client";
import { getCachedJson, setCachedJson, deleteCachedJson } from "@/lib/offlineCache";
import { getMalagasyBooks } from "@/lib/malagasyBible";
import { DICTIONARY_URL } from "@/lib/bibleDictionary";
import { groupVersesByChapter } from "@/lib/offlineBibleSearch";

const PAGE_SIZE = 1000;
const HELLOAO_BOOKS_URL = "https://bible.helloao.org/api/fra_lsg/books.json";
const META_KEY = "bible-offline-meta";
const DICTIONARY_KEY = "bible-dictionary-offline";

function chapterCacheKey(translationId, bookId, chapter) {
  return `bible-chapter:${translationId}:${bookId}:${chapter}`;
}
function booksCacheKey(translationId) {
  return `bible-books:${translationId}`;
}
function searchIndexKey(translationId) {
  return `bible-search-index:${translationId}`;
}

// --- Cache "au fil de l'eau" (lecture en ligne qui alimente le hors-ligne) --

export async function cacheChapterVerses(translationId, bookId, chapter, verses) {
  if (!translationId || !bookId || !chapter) return;
  await setCachedJson(chapterCacheKey(translationId, bookId, chapter), verses);
}
export async function getCachedChapterVerses(translationId, bookId, chapter) {
  if (!translationId || !bookId || !chapter) return null;
  return await getCachedJson(chapterCacheKey(translationId, bookId, chapter));
}
export async function cacheBooksList(translationId, books) {
  await setCachedJson(booksCacheKey(translationId), books);
}
export async function getCachedBooksList(translationId) {
  return await getCachedJson(booksCacheKey(translationId));
}

// --- Métadonnées de téléchargement complet ---------------------------------

export async function getOfflineMeta() {
  return (await getCachedJson(META_KEY)) || {};
}
async function patchMeta(translationId, patch) {
  const meta = await getOfflineMeta();
  meta[translationId] = { ...(meta[translationId] || {}), ...patch };
  await setCachedJson(META_KEY, meta);
  return meta[translationId];
}
export async function isTranslationFullyOffline(translationId) {
  const meta = await getOfflineMeta();
  return !!meta?.[translationId]?.complete;
}

// --- Téléchargement complet d'une traduction --------------------------------

// Télécharge l'intégralité des versets déjà synchronisés côté admin pour une
// traduction ("lsg1910" ou "malagasy") et alimente le même cache que la
// lecture chapitre par chapitre, afin que BibleReader n'ait besoin d'aucune
// logique séparée pour le hors-ligne. Construit également l'index plat
// utilisé par la concordance hors-ligne.
export async function downloadBibleTranslation(translationId, { onProgress } = {}) {
  let books;
  if (translationId === "malagasy") {
    books = getMalagasyBooks();
  } else {
    const cached = await getCachedBooksList(translationId);
    if (cached?.length) {
      books = cached;
    } else {
      const res = await fetch(HELLOAO_BOOKS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      books = (data?.books || [])
        .map((b) => ({
          id: b.id,
          name: b.commonName || b.name,
          order: Number(b.order),
          numberOfChapters: Number(b.numberOfChapters),
        }))
        .filter((b) => b.id && b.name && b.numberOfChapters > 0)
        .sort((a, b) => a.order - b.order);
      await cacheBooksList(translationId, books);
    }
  }
  const byOrder = new Map(books.map((b) => [b.order, b]));

  let skip = 0;
  const flat = [];
  while (true) {
    const batch = await base44.entities.BibleVerse.filter({ translation: translationId }, "bookOrder", PAGE_SIZE, skip);
    if (!Array.isArray(batch) || batch.length === 0) break;
    flat.push(...batch);
    skip += batch.length;
    onProgress?.({ loaded: flat.length });
    if (batch.length < PAGE_SIZE) break;
  }
  if (flat.length === 0) {
    throw new Error(
      "Aucun verset synchronisé pour cette traduction. Demandez à un administrateur de lancer la synchronisation biblique."
    );
  }

  const grouped = groupVersesByChapter(flat);
  for (const [key, verses] of grouped) {
    const [bookOrderStr, chapterStr] = key.split(":");
    const book = byOrder.get(Number(bookOrderStr));
    if (!book) continue;
    await cacheChapterVerses(translationId, book.id, Number(chapterStr), verses);
  }

  await setCachedJson(
    searchIndexKey(translationId),
    flat.map((v) => ({
      book: v.book,
      bookOrder: v.bookOrder,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
      normalizedText: v.normalizedText,
    }))
  );

  await patchMeta(translationId, {
    complete: true,
    verseCount: flat.length,
    downloadedAt: new Date().toISOString(),
  });
  return flat.length;
}

export async function getOfflineSearchIndex(translationId) {
  return await getCachedJson(searchIndexKey(translationId));
}

export async function removeOfflineTranslation(translationId) {
  await deleteCachedJson(searchIndexKey(translationId));
  await patchMeta(translationId, { complete: false, verseCount: 0, downloadedAt: null });
}

// --- Dictionnaire ------------------------------------------------------------

export async function cacheDictionary(data) {
  await setCachedJson(DICTIONARY_KEY, data);
}
export async function getOfflineDictionary() {
  return await getCachedJson(DICTIONARY_KEY);
}
export async function downloadDictionaryOffline() {
  const res = await fetch(DICTIONARY_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  await cacheDictionary(data);
  return Array.isArray(data) ? data.length : 0;
}
