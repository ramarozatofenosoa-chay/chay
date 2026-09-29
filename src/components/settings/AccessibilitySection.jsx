import React from "react";
import { usePreferences } from "@/lib/PreferencesContext";
import PrefSwitch from "@/components/settings/PrefSwitch";

export default function AccessibilitySection() {
  const { prefs, setPref } = usePreferences();
  const textSizes = [
    { value: "sm", label: "Petite" },
    { value: "md", label: "Normale" },
    { value: "lg", label: "Grande" },
    { value: "xl", label: "Très grande" },
  ];

  return (
    <div className="space-y-1">
      <fieldset>
        <legend className="text-xs font-semibold mb-1">Taille du texte</legend>
        <div className="grid grid-cols-2 gap-2">
          {textSizes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={prefs.text_size === value}
              onClick={() => setPref("text_size", value)}
              className={`min-h-11 rounded-xl border text-sm font-semibold ${
                prefs.text_size === value
                  ? "brand-gradient text-white border-transparent"
                  : "border-border bg-card"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-foreground/50">
          Vous pouvez aussi agrandir l'affichage avec le zoom de votre appareil.
        </p>
      </fieldset>

      <div className="border-t border-border my-2" />
      <PrefSwitch
        label="Contraste renforcé"
        checked={prefs.contrast === "high"}
        onChange={(v) => setPref("contrast", v ? "high" : "normal")}
      />
      <PrefSwitch
        label="Réduire les animations"
        checked={prefs.reduce_animations}
        onChange={(v) => setPref("reduce_animations", v)}
      />

      <div className="border-t border-border my-2" />
      <div className="py-2">
        <p className="text-sm font-semibold">Taille des zones tactiles</p>
        <p className="text-xs text-foreground/50">
          Les éléments interactifs utilisent déjà une taille minimale de 44 px
          (recommandation iOS/Android).
        </p>
      </div>

      <PrefSwitch
        label="Sous-titres"
        description="Afficher les sous-titres des vidéos lorsque disponibles."
        checked={prefs.notif_subtitles}
        onChange={(v) => setPref("notif_subtitles", v)}
      />
      <PrefSwitch
        label="Synthèse vocale"
        description="Lire le texte à voix haute (selon les capacités de l'appareil)."
        checked={prefs.tts}
        onChange={(v) => setPref("tts", v)}
      />

      <p className="text-xs text-foreground/50 pt-1">
        Ces réglages sont partagés avec la section « Préférences d'affichage »
        pour rester cohérents dans toute l'application.
      </p>
    </div>
  );
}
