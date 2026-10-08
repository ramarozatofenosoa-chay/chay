import React from "react";
import { Moon, Sun } from "lucide-react";
import { usePreferences } from "@/lib/PreferencesContext";

export default function ThemeToggle({ className = "" }) {
  const { prefs, setPref } = usePreferences();
  // "auto" est résolu via la préférence système pour afficher la bonne icône.
  const resolved =
    prefs.theme === "auto" && typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : prefs.theme;
  const isDark = resolved !== "light";
  return (
    <button
      onClick={() => setPref("theme", isDark ? "light" : "dark")}
      aria-label="Basculer le mode sombre"
      className={`h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted transition ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}