import { useState, useEffect } from "react";
import {
  THEME_STORAGE_KEY,
  readStoredTheme,
  persistTheme,
  shouldApplyDark,
  normalizeTheme,
} from "@/lib/theme";

export { THEME_STORAGE_KEY };

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

// Etat initial : la préférence enregistrée est PRIORITAIRE ; sans préférence
// (ou valeur invalide) on retombe sur le mode sombre par défaut.
function getInitial() {
  if (typeof window === "undefined") return "dark";
  return readStoredTheme(window.localStorage);
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", shouldApplyDark(theme, systemPrefersDark()));
    // Persiste uniquement quand l'utilisateur a un état React valide.
    // (La lecture initiale ne touche jamais au stockage : une préférence
    // existante n'est donc jamais écrasée au démarrage.)
    persistTheme(window.localStorage, theme);

    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () =>
        root.classList.toggle("dark", shouldApplyDark("auto", mq.matches));
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (t) => setThemeState(normalizeTheme(t));
  const toggle = () =>
    setThemeState((t) => (shouldApplyDark(t, systemPrefersDark()) ? "light" : "dark"));
  const resolved = shouldApplyDark(theme, systemPrefersDark()) ? "dark" : "light";

  return { theme, setTheme, toggle, resolved };
}
