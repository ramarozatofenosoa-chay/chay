// Logique centralisée du thème CHAY — source de vérité unique.
// Utilisée par :
//   - le script inline de index.html (avant le premier rendu, anti-flash)
//   - src/hooks/useTheme.js (intégration React)
//   - src/lib/PreferencesContext.jsx (préférence globale "theme")
//
// Règles :
//   1. Aucune préférence enregistrée  => mode SOMBRE par défaut.
//   2. Une préférence enregistrée ("light" | "dark" | "auto") est PRIORITAIRE
//      sur le défaut et doit être restaurée à chaque démarrage.
//   3. Toute valeur inconnue / corrompue retombe sur le défaut sombre.

export const THEME_STORAGE_KEY = "chay-theme";

export const DEFAULT_THEME = "dark";

export const VALID_THEMES = ["light", "dark", "auto"];

/**
 * Normalise une valeur de thème brute : seules les valeurs connues sont
 * conservées ; toute autre valeur (null, legacy, corrompue) donne le défaut.
 */
export function normalizeTheme(value) {
  return VALID_THEMES.includes(value) ? value : DEFAULT_THEME;
}

/**
 * Lit la préférence de thème depuis un stockage compatible localStorage.
 * Retourne toujours une valeur normalisée ("light" | "dark" | "auto").
 * Ne modifie jamais le stockage (lecture seule).
 */
export function readStoredTheme(storage) {
  try {
    if (!storage) return DEFAULT_THEME;
    return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
  } catch {
    // Accès localStorage refusé (mode privé, webview bridée...) : défaut sûr.
    return DEFAULT_THEME;
  }
}

/**
 * Persiste la préférence choisie par l'utilisateur.
 */
export function persistTheme(storage, theme) {
  try {
    if (!storage) return;
    storage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
  } catch {
    /* stockage indisponible : on ignore silencieusement */
  }
}

/**
 * Détermine s'il faut appliquer la classe CSS "dark".
 * "auto" suit la préférence système (prefers-color-scheme).
 */
export function shouldApplyDark(theme, systemPrefersDark) {
  const t = normalizeTheme(theme);
  if (t === "dark") return true;
  if (t === "light") return false;
  return !!systemPrefersDark;
}
