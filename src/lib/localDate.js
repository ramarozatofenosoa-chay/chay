// ─────────────────────────────────────────────────────────────────────────
// Dates en HEURE LOCALE
//
// `new Date().toISOString()` renvoie la date UTC. À Madagascar (UTC+3),
// entre minuit et 3 h du matin, l'application croyait donc que nous étions
// encore la veille : le verset du jour s'affichait avec un jour de retard
// et la notification partait sur la mauvaise date.
// Toutes les dates du « verset du jour » passent par ces helpers.
// ─────────────────────────────────────────────────────────────────────────

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Date locale au format "YYYY-MM-DD" (celui du champ `reading_date`). */
export function toISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → Date locale, ou null si la chaîne est invalide. */
export function fromISODate(value) {
  const m = ISO_RE.exec(String(value || ""));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  // Rejette les dates inexistantes (31 février…) : le constructeur les
  // repousse silencieusement dans le mois suivant.
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export const isISODate = (value) => fromISODate(value) !== null;

/** Décale une date ISO : addDaysISO("2026-09-25", 1) → "2026-09-26". */
export function addDaysISO(value, days) {
  const date = fromISODate(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/**
 * Formatage français. `long: true` → « samedi 26 septembre 2026 »,
 * sinon « sam. 26 sept. » (compact, pour les listes).
 */
export function formatISODate(value, { long = false } = {}) {
  const date = fromISODate(value);
  if (!date) return "";
  return date.toLocaleDateString(
    "fr-FR",
    long
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : { weekday: "short", day: "numeric", month: "short" }
  );
}
