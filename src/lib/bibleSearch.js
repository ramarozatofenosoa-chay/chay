// Utilitaires partagés par la recherche plein texte biblique (frontend).

import { getMalagasyBooks } from "./malagasyBible";

// Traductions proposées dans le sélecteur de recherche, indépendantes de la
// langue de l'interface (toujours française dans cette application).
export const SEARCH_TRANSLATION_OPTIONS = [
  {
    id: "lsg1910",
    shortLabel: "Français — LSG",
    label: "Français — Louis Segond 1910",
    readerVersion: "fra_lsg",
    language: "fr",
  },
  {
    id: "malagasy",
    shortLabel: "Malagasy — 1865",
    label: "Malagasy — Baiboly Malagasy 1865",
    readerVersion: "MG1865",
    language: "mg",
  },
];

// Normalisation identique à celle utilisée côté backend pour l'indexation :
// le français retire les accents, le malgache conserve tous ses caractères.
export function normalizeSearchText(text, language) {
  if (!text) return "";
  let t = String(text).toLowerCase().normalize("NFC");
  if (language === "fr") {
    t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  return t.replace(/\s+/g, " ").trim();
}

const ACCENT_CLASSES = {
  a: "aàâä",
  e: "eéèêë",
  i: "iîï",
  o: "oôö",
  u: "uùûü",
  c: "cç",
  n: "nñ",
};

// Construit une regex de surbrillance insensible à la casse et, pour le
// français, tolérante aux variantes accentuées (jesus/JESUS/Jésus).
export function buildHighlightRegex(query, language) {
  const escaped = (query || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return null;
  if (language !== "fr") return new RegExp(`(${escaped})`, "gi");
  const pattern = escaped.replace(/[a-zA-Z]/g, (ch) => {
    const variants = ACCENT_CLASSES[ch.toLowerCase()];
    if (!variants) return ch;
    return `[${variants}${variants.toUpperCase()}]`;
  });
  return new RegExp(`(${pattern})`, "gi");
}

// Concordance : liste des 66 livres (ordre canonique 1 = Genèse, 66 = Apocalypse).
// L'index + 1 donne le `bookOrder` envoyé au backend — on ne filtre JAMAIS sur le
// nom du livre car la base stocke « MATTHIEU » (LSG, majuscules) et « Matio » (MG).
// Les libellés ci-dessous servent uniquement à l'affichage dans la liste déroulante.
export const SEARCH_BOOKS_FR = [
  "Genèse", "Exode", "Lévitique", "Nombres", "Deutéronome", "Josué", "Juges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Rois", "2 Rois", "1 Chroniques", "2 Chroniques", "Esdras",
  "Néhémie", "Esther", "Job", "Psaumes", "Proverbes", "Ecclésiaste",
  "Cantique des cantiques", "Ésaïe", "Jérémie", "Lamentations", "Ézéchiel", "Daniel",
  "Osée", "Joël", "Amos", "Abdias", "Jonas", "Michée", "Nahum", "Habacuc", "Sophonie",
  "Aggée", "Zacharie", "Malachie",
  "Matthieu", "Marc", "Luc", "Jean", "Actes", "Romains", "1 Corinthiens", "2 Corinthiens",
  "Galates", "Éphésiens", "Philippiens", "Colossiens", "1 Thessaloniciens",
  "2 Thessaloniciens", "1 Timothée", "2 Timothée", "Tite", "Philémon", "Hébreux",
  "Jacques", "1 Pierre", "2 Pierre", "1 Jean", "2 Jean", "3 Jean", "Jude", "Apocalypse",
];

// Libellés malgaches : réutilise le catalogue déjà utilisé par le lecteur,
// pour rester strictement identique à ce qui est stocké en base.
const SEARCH_BOOKS_MG = getMalagasyBooks().map((b) => b.name);

// Livres proposés dans la liste déroulante pour la traduction sélectionnée.
export function getSearchBooks(translation) {
  const labels = translation === "malagasy" ? SEARCH_BOOKS_MG : SEARCH_BOOKS_FR;
  return labels.map((label, i) => ({ order: i + 1, label }));
}