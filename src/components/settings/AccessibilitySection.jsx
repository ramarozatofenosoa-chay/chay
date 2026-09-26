import React from "react";
import { usePreferences } from "@/lib/PreferencesContext";
import PrefSwitch from "@/components/settings/PrefSwitch";

export default function AccessibilitySection() {
  const { prefs, setPref } = usePreferences();

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold mb-1">Taille du texte</p>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => setPref("text_size", "sm")}
          className={`h-10 rounded-xl border text-sm font-semibold ${
            prefs.text_size === "sm"
              ? "brand-gradient text-white border-transparent"
              : "border-border bg-card"
          }`}
        >
          Petite
        </button>
      </div>

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
