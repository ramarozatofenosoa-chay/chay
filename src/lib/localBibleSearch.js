// Recherche plein texte biblique 100 % locale (aucune API externe), basée sur
// les index inversés de concordance (`bibleConcordance`) : la liste des
// versets candidats est obtenue en temps constant via l'index, puis le texte
// complet du verset est vérifié pour les expressions multi-mots. Le lecteur
// biblique et la concordance partagent donc le même mécanisme d'indexation.
//
// Comportement :
//   - mot simple : correspondance sur mot entier (les mots courts comme
//     « a », « ou » sont recherchés comme tels, sans minimum de longueur) ;
//   - expression : tous les mots doivent apparaître dans le même verset ;
//   - insensible à la casse ; en français, tolérante aux accents (« jesus »
//     trouve « Jésus ») ; en malgasy les accents sont respectés ;
//   - pagination par offset/limit pour les résultats très nombreux.

import { loadConcordance, lookupPhrase } from "./bibleConcordance.js";

const PAGE_SIZE = 50;

export const MAX_SEARCH_PAGE_SIZE = PAGE_SIZE;

// Charge l'index local d'une langue ("fr" | "mg").
export function loadLocalSearchIndex(lang) {
  return loadConcordance(lang);
}

// Formate une référence affichable : « Genèse 1:1 ».
export function formatVerseRef(bookName, chapter, verse) {
  return `${bookName} ${chapter}:${verse}`;
}

// Recherche une requête dans la Bible locale d'une langue.
// Retourne { total, items, hasMore } où chaque item porte la référence
// exacte (livre/canonique, chapitre, verset) et le texte original.
export function searchLocalVerses(indexData, query, { offset = 0, limit = PAGE_SIZE } = {}) {
  const trimmed = String(query || "").trim().replace(/\s+/g, " ");
  if (!trimmed || !indexData) return { total: 0, items: [], hasMore: false };
  const { total, entries } = lookupPhrase(indexData, trimmed, { offset, limit });
  const items = entries.map((e) => ({
    lang: indexData.lang,
    bookId: indexData.books[e.bookIdx]?.id,
    book: indexData.books[e.bookIdx]?.name,
    bookOrder: e.bookIdx + 1, // rang canonique 1..66
    chapter: e.chapter,
    verse: e.verse,
    text: e.text,
  }));
  return { total, items, hasMore: offset + items.length < total };
}
