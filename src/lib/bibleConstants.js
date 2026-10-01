export const HIGHLIGHT_COLORS = [
  { id: "green", swatch: "bg-green-500", verse: "bg-green-400/25" },
  { id: "pink", swatch: "bg-pink-500", verse: "bg-pink-400/25" },
  { id: "yellow", swatch: "bg-yellow-500", verse: "bg-yellow-400/25" },
  { id: "blue", swatch: "bg-blue-500", verse: "bg-blue-400/25" },
  { id: "brown", swatch: "bg-amber-700", verse: "bg-amber-600/25" },
  { id: "purple", swatch: "bg-purple-500", verse: "bg-purple-400/25" },
];

// Langues proposées dans le lecteur (étiquettes courtes, sans drapeau).
export const LANGUAGES = [
  { id: "fr", label: "FR" },
  { id: "mg", label: "MG" },
];

export const VERSIONS = {
  fr: [
    {
      id: "fra_lsg",
      label: "Louis Segond 1910 (LSG)",
      available: true,
      engine: "helloao",
      audio: { supported: true, source: "wordproject" },
      source: "helloao (fra_lsg) + audio WordProject",
      licenseUrl: "https://www.wordproject.org/contact/new/disclaim.htm",
      attribution: "Texte Louis Segond 1910 (domaine public) · Audio WordProject.org.",
    },
  ],
mg: [
  {
    id: "mg",
    label: "Bible Malgache (Baiboly Masina)",
    available: true,            // ← OBLIGATOIREMENT true, sinon "source non configurée"
    engine: "antonionavira",    // ← on revient à ta source d'origine
    audio: { supported: false, configured: false },
    source: "baiboly.antonionavira.mg",
    licenseUrl: "https://baiboly.antonionavira.mg/",
    attribution: "Baiboly Malagasy 1865.",
  },
],
};

// Identifiant de traduction utilisé par l'entité BibleVerse / le backend de
// recherche ("lsg1910" / "malagasy"), différent de l'id du lecteur en ligne
// ("fra_lsg" / "mg"). Centralise la correspondance pour que le cache
// hors-ligne (alimenté au fil de l'eau par le lecteur, et en masse par le
// téléchargement complet) utilise toujours la même clé.
export function toOfflineTranslationId(readerVersionId) {
  return readerVersionId === "mg" ? "malagasy" : "lsg1910";
}
