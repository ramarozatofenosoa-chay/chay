// Normalisation partagée pour l'indexation et la recherche plein texte biblique.
// Le français retire les accents (recherche insensible aux accents) ; le
// malgache conserve tous ses caractères pour ne pas changer le sens des mots.
export function normalizeSearchText(text: string, language: string): string {
  if (!text) return "";
  let t = String(text).toLowerCase().normalize("NFC");
  if (language === "fr") {
    t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  return t.replace(/\s+/g, " ").trim();
}