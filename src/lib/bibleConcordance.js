// Concordance biblique entièrement hors ligne, construite à partir des
// index inversés statiques générés depuis les fichiers bibliques locaux :
//   - /data/concordance/concordance-fr.json (Bible française)
//   - /data/concordance/concordance-mg.json (Bible malagasy)
// Chaque index associe chaque mot du texte biblique (TOUS les mots, y
// compris les mots très courts et grammaticaux — aucune liste d'exclusion)
// aux versets qui le contiennent. Les fichiers sont régénérés par
// `npm run build:bible-index` lorsque les textes sources changent.
//
// Persistance hors ligne : la réponse HTTP est recopiée dans la Cache
// Storage API (`offlineCache`) puis dans IndexedDB en dernier repli ; une
// application déjà ouverte une fois avec connexion (ou installée en PWA /
// empaquetée en natif, où ces fichiers sont embarqués) reste pleinement
// fonctionnelle sans Internet.

import { getCachedJson, setCachedJson } from "./offlineCache.js";

const INDEX_URLS = {
  fr: "/data/concordance/concordance-fr.json",
  mg: "/data/concordance/concordance-mg.json",
};

const CACHE_PREFIX = "bible-concordance-v1"; // incrémenter si le format change
const IDB_NAME = "chay-bible-local";
const IDB_STORE = "json";

function idbOpen() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function idbGet(key) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbPut(key, value) {
  try {
    const db = await idbOpen();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* stockage non disponible */
  }
}

function isValidIndex(data) {
  return (
    data &&
    Array.isArray(data.books) &&
    Array.isArray(data.verses) &&
    data.index &&
    typeof data.index === "object"
  );
}

const memoryIndex = {};

// Charge l'index complet d'une langue (mémoire → Cache Storage → IndexedDB →
// réseau local, qui alimente les caches pour les prochaines ouvertures).
export async function loadConcordance(lang) {
  if (!INDEX_URLS[lang]) throw new Error("Langue de concordance inconnue.");
  if (isValidIndex(memoryIndex[lang])) return memoryIndex[lang];
  const url = INDEX_URLS[lang];
  const cacheKey = `${CACHE_PREFIX}:${url}`;
  let data = await getCachedJson(cacheKey).catch(() => null);
  if (!isValidIndex(data)) data = await idbGet(cacheKey);
  if (!isValidIndex(data)) {
    const res = await fetch(url, { cache: "default" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    if (!isValidIndex(data)) throw new Error("Index de concordance invalide ou corrompu.");
    setCachedJson(cacheKey, data).catch(() => {});
    idbPut(cacheKey, data).catch(() => {});
  }
  memoryIndex[lang] = data;
  return data;
}

// --- Normalisation -----------------------------------------------------------

const ACCENT_FOLD = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");

// Clé d'index attendue : minuscules, accents conservés (comme à la
// génération). En français, « a » correspond aussi à « â »… ; en malgasy,
// les accents sont distinctifs et ne sont donc pas retirés.
export function wordToIndexKeys(word, lang) {
  const w = String(word || "").trim().toLowerCase();
  if (!w) return [];
  if (lang === "fr") {
    const folded = ACCENT_FOLD(w);
    return folded !== w ? [w, folded] : [w];
  }
  return [w];
}

// Formes acceptées pour un mot du texte lors de la recherche multi-mots
// (insensible à la casse ; tolérance aux accents uniquement en français).
function acceptedForms(word, lang) {
  const w = String(word || "").toLowerCase();
  if (lang === "fr") return new Set([w, ACCENT_FOLD(w)]);
  return new Set([w]);
}

const WORD_RE = /[\p{L}]+(?:['’-][\p{L}]+)*/gu;

// Recherche d'un mot exact (correspondance sur mot entier, jamais à
// l'intérieur d'un autre mot). Retourne { total, entries } où entries =
// [{ bookIdx, chapter, verse, text }] triés en ordre canonique.
export function lookupWord(indexData, word, { offset = 0, limit = 50 } = {}) {
  const raw = String(word || "").trim();
  if (!raw || !isValidIndex(indexData)) return { total: 0, entries: [] };
  const lang = indexData.lang;
  const keys = wordToIndexKeys(raw, lang);
  const postings = new Set();
  for (const k of keys) {
    const list = indexData.index[k];
    if (Array.isArray(list)) for (const i of list) postings.add(i);
  }
  const sorted = [...postings].sort((a, b) => a - b);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const page = sorted.slice(safeOffset, safeOffset + safeLimit);
  const entries = page.map((i) => {
    const v = indexData.verses[i];
    return { bookIdx: v[0], chapter: v[1], verse: v[2], text: v[3] };
  });
  return { total: sorted.length, entries };
}

// Recherche d'une expression de plusieurs mots : tous les mots doivent
// apparaître comme mots entiers dans le même verset (intersection des
// postings, sans contrainte d'ordre ni de proximité). Un seul mot saisi
// équivaut à lookupWord.
export function lookupPhrase(indexData, phrase, { offset = 0, limit = 50 } = {}) {
  const raw = String(phrase || "").trim().replace(/\s+/g, " ");
  if (!raw || !isValidIndex(indexData)) return { total: 0, entries: [] };
  const words = raw.match(WORD_RE) || [];
  if (words.length === 0) return { total: 0, entries: [] };
  if (words.length === 1) return lookupWord(indexData, words[0], { offset, limit });

  const lang = indexData.lang;
  // Intersection des listes d'affichage de chaque mot.
  const sets = words.map((w) => {
    const s = new Set();
    for (const k of wordToIndexKeys(w, lang)) {
      const list = indexData.index[k];
      if (Array.isArray(list)) for (const i of list) s.add(i);
    }
    return s;
  });
  sets.sort((a, b) => a.size - b.size);
  let common = sets[0];
  for (const s of sets.slice(1)) {
    for (const i of common) if (!s.has(i)) common.delete(i);
    if (common.size === 0) break;
  }
  // Vérification finale sur forme insensible à la casse/accents : on
  // re-tokenise les versets candidats (peu nombreux après intersection).
  const accepted = words.map((w) => acceptedForms(w, lang));
  const candidates = [...common].sort((a, b) => a - b);
  const matches = [];
  for (const i of candidates) {
    const toks = indexData.verses[i][3].match(WORD_RE) || [];
    const forms = new Set(toks.map((t) => t.toLowerCase()));
    if (accepted.every((set) => [...set].some((f) => forms.has(f)))) matches.push(i);
  }
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const page = matches.slice(safeOffset, safeOffset + safeLimit);
  const entries = page.map((i) => {
    const v = indexData.verses[i];
    return { bookIdx: v[0], chapter: v[1], verse: v[2], text: v[3] };
  });
  return { total: matches.length, entries };
}

// Accès au texte intégral d'un verset (utilisé par le lecteur quand la
// requête vient de la concordance — mêmes données que lookupWord).
export function getVerseAt(indexData, bookIdx, chapter, verse) {
  const v = indexData?.verses?.find(
    (x) => x[0] === bookIdx && x[1] === chapter && x[2] === verse
  );
  if (!v) return null;
  return { bookIdx: v[0], chapter: v[1], verse: v[2], text: v[3] };
}
