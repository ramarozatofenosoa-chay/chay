// Dictionnaire biblique Westphal (1978 entrées nettoyées), servi comme JSON
// statique public. Les définitions pouvant dépasser la taille d'un champ
// d'entité, on charge le fichier à l'exécution et on filtre côté client.
// Schéma d'une entrée : { mot, n (mot normalisé), d (définition), s (source) }
export const DICTIONARY_URL =
  "https://base44.app/api/apps/6aa138d0e963d9e5f59d838c/files/mp/public/6aa138d0e963d9e5f59d838c/ac9a646f7_dictionnaire_westphal.json";

export const DICTIONARY_SOURCE = "Dictionnaire Encyclopédique de la Bible (A. Westphal)";

export function normalizeWord(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}