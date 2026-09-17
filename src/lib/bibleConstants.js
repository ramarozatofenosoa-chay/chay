export const HIGHLIGHT_COLORS = [
  { id: "green", swatch: "bg-green-500", verse: "bg-green-400/25" },
  { id: "pink", swatch: "bg-pink-500", verse: "bg-pink-400/25" },
  { id: "yellow", swatch: "bg-yellow-500", verse: "bg-yellow-400/25" },
  { id: "blue", swatch: "bg-blue-500", verse: "bg-blue-400/25" },
  { id: "brown", swatch: "bg-amber-700", verse: "bg-amber-600/25" },
  { id: "purple", swatch: "bg-purple-500", verse: "bg-purple-400/25" },
];

export const LANGUAGES = [
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "en", label: "English", flag: "🇬🇧" },
];

// Une seule version par langue
export const VERSIONS = {
  fr: [{ id: "fra_lsg", label: "Louis Segond 1910 (LSG)" }],
  en: [{ id: "BSB", label: "Berean Standard Bible (BSB)" }],
};