export const HIGHLIGHT_COLORS = [
  { id: "green", swatch: "bg-green-500", verse: "bg-green-400/25" },
  { id: "pink", swatch: "bg-pink-500", verse: "bg-pink-400/25" },
  { id: "yellow", swatch: "bg-yellow-500", verse: "bg-yellow-400/25" },
  { id: "blue", swatch: "bg-blue-500", verse: "bg-blue-400/25" },
  { id: "brown", swatch: "bg-amber-700", verse: "bg-amber-600/25" },
  { id: "purple", swatch: "bg-purple-500", verse: "bg-purple-400/25" },
];

// Langues proposées dans le lecteur.
export const LANGUAGES = [
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "mg", label: "Malagasy", flag: "🇲🇬" },
];

// Une seule version par langue. Chaque version indique si sa source est
// disponible (`available`) et si l'audio est supporté/configuré.
//  - LSG : texte disponible (helloao fra_lsg), audio non encore configuré.
//  - MG1865 : source pas encore configurée/autorisée -> message clair affiché.
export const VERSIONS = {
  fr: [
    {
      id: "fra_lsg",
      label: "Louis Segond 1910 (LSG)",
      available: true,
      audio: { supported: true, configured: false },
      source: "helloao (fra_lsg)",
      licenseUrl: "https://helloao.org/",
      attribution: "Louis Segond 1910 — texte du domaine public.",
    },
  ],
  mg: [
    {
      id: "MG1865",
      label: "Baiboly Malagasy 1865 (MG1865)",
      available: false,
      audio: { supported: false, configured: false },
      source: null,
      licenseUrl: null,
      attribution: "Baiboly Malagasy 1865.",
    },
  ],
};