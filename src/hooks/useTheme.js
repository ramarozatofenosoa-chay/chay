import { useState, useEffect } from "react";

const KEY = "chay-theme";

function getInitial() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(KEY);
  // Seul "light" est explicitement conserve : toute autre valeur (y compris
  // "auto" ou une valeur expiree/corrompue) est traitee comme "dark".
  // Le theme par defaut de CHAY est le mode sombre.
  if (saved === "light") return "light";
  return "dark";
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolveDark(t) {
  if (t === "dark") return true;
  if (t === "light") return false;
  return systemPrefersDark();
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolveDark(theme);
    root.classList.toggle("dark", isDark);
    // Ecrit toujours dans localStorage pour synchroniser avec le script
    // inline de index.html (qui evite le flash au prochain chargement).
    localStorage.setItem(KEY, theme);

    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => root.classList.toggle("dark", mq.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (t) => setThemeState(t);
  const toggle = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));
  const resolved =
    theme === "auto" ? (systemPrefersDark() ? "dark" : "light") : theme;

  return { theme, setTheme, toggle, resolved };
}
