// Utilitaires partagés par la recherche plein texte biblique (frontend).

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