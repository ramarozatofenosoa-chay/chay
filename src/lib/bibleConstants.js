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
    available: true,        // ← true
    engine: "helloao",      // ← helloao (PAS antonionavira)
    audio: { supported: false },
    source: "bible.helloao.org/api/mg",
    licenseUrl: "https://bible.helloao.org/docs/",
    attribution: "Traduction Baiboly Masina via Bible.HelloAO.org",
  },
],
};