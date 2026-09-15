import { useState, useEffect } from "react";

const KEY = "chay-theme";

function getInitial() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark" || saved === "auto") return saved;
  return "auto";
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
    root.classList.toggle("dark", resolveDark(theme));
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