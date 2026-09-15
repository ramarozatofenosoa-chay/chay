import React from "react";
import { usePreferences } from "@/lib/PreferencesContext";
import PrefSwitch from "@/components/settings/PrefSwitch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = [
  ["mon", "Lun"],
  ["tue", "Mar"],
  ["wed", "Mer"],
  ["thu", "Jeu"],
  ["fri", "Ven"],
  ["sat", "Sam"],
  ["sun", "Dim"],
];

export default function NotificationsSection() {
  const { prefs, setPref } = usePreferences();
  const enabled = prefs.notifications_enabled;

  const toggleDay = (d) => {
    const has = prefs.notif_verse_days.includes(d);
    setPref(
      "notif_verse_days",
      has ? prefs.notif_verse_days.filter((x) => x !== d) : [...prefs.notif_verse_days, d]
    );
  };

  return (
    <div className="space-y-1">
      <PrefSwitch
        label="Autoriser les notifications"
        description="Activez ou désactivez toutes les notifications."
        checked={enabled}
        onChange={(v) => setPref("notifications_enabled", v)}
      />

      <div className={enabled ? "" : "opacity-50 pointer-events-none"}>
        <div className="border-t border-border my-2" />
        <PrefSwitch
          label="Verset du jour"
          checked={prefs.notif_verse}
          onChange={(v) => setPref("notif_verse", v)}
        />
        {prefs.notif_verse && (
          <div className="pl-1 py-2 space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Heure</Label>
              <Input
                type="time"
                value={prefs.notif_verse_time}
                onChange={(e) => setPref("notif_verse_time", e.target.value)}
                className="h-9 w-28"
              />
            </div>
            <div>
              <Label className="text-xs">Jours</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {DAYS.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleDay(id)}
                    className={`h-9 min-w-9 px-2 rounded-lg text-xs font-semibold border ${
                      prefs.notif_verse_days.includes(id)
                        ? "brand-gradient text-white border-transparent"
                        : "border-border bg-card"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border my-2" />
        <PrefSwitch
          label="Annonces"
          checked={prefs.notif_announcements}
          onChange={(v) => setPref("notif_announcements", v)}
        />
        <PrefSwitch
          label="Événements de l'Église"
          checked={prefs.notif_events}
          onChange={(v) => setPref("notif_events", v)}
        />
        <PrefSwitch
          label="Actualités"
          checked={prefs.notif_news}
          onChange={(v) => setPref("notif_news", v)}
        />
        <PrefSwitch
          label="Notifications importantes"
          description="Mises à jour essentielles de l'application."
          checked={prefs.notif_important}
          onChange={(v) => setPref("notif_important", v)}
        />

        <div className="border-t border-border my-2" />
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50 py-1">
          Canaux
        </p>
        <PrefSwitch
          label="E-mail"
          checked={prefs.notif_email}
          onChange={(v) => setPref("notif_email", v)}
        />
        <PrefSwitch
          label="Notifications push"
          checked={prefs.notif_push}
          onChange={(v) => setPref("notif_push", v)}
        />
        <PrefSwitch
          label="Son"
          checked={prefs.notif_sound}
          onChange={(v) => setPref("notif_sound", v)}
        />
        <PrefSwitch
          label="Aperçu sur écran verrouillé"
          checked={prefs.notif_lock_preview}
          onChange={(v) => setPref("notif_lock_preview", v)}
        />

        <div className="border-t border-border my-2" />
        <PrefSwitch
          label="Nouvelle version de l'application"
          description="Être notifié lors d'une mise à jour."
          checked={prefs.notif_new_version}
          onChange={(v) => setPref("notif_new_version", v)}
        />

        <p className="text-xs text-foreground/50 px-1 pt-1">
          Les préférences sont enregistrées sur votre compte. L'envoi effectif
          des notifications (verset du jour, push) nécessite un service planifié
          côté serveur — fonctionnalité en cours de déploiement.
        </p>
      </div>
    </div>
  );
}