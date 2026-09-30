import React, { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { BellRing, CheckCircle2, Settings } from "lucide-react";
import { checkAndroidMediaNotificationPermission } from "@/lib/androidMediaNotification";

export default function MediaNotificationStatus() {
  const [nativeAndroid, setNativeAndroid] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let isAndroid = false;
    try {
      isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
      setNativeAndroid(isAndroid);
    } catch {
      setNativeAndroid(false);
    }
    const onStatus = (event) => setStatus(event.detail || {});
    window.addEventListener("chay-media-notification-status", onStatus);
    if (isAndroid) {
      checkAndroidMediaNotificationPermission()
        .then(setStatus)
        .catch((error) => setStatus({ error: error?.message || String(error) }));
    }
    return () => window.removeEventListener("chay-media-notification-status", onStatus);
  }, []);

  if (!nativeAndroid) return null;

  const enabled = status?.granted === true;
  const detail = status?.error
    ? status.error
    : status?.appEnabled === false
      ? "Les notifications de CHAY sont désactivées dans les paramètres Android."
      : status?.channelEnabled === false
        ? "Le canal « Lecture multimédia » est désactivé dans Android."
        : "Autorisez les notifications Android pour afficher le lecteur dans le volet des notifications.";

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border p-3 mb-1 ${
        enabled ? "border-border bg-muted/40" : "border-destructive/30 bg-destructive/5"
      }`}
      role="status"
    >
      {enabled ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
      ) : (
        <BellRing className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">Commandes multimédias Android</p>
        <p className={`mt-0.5 text-xs ${enabled ? "text-foreground/60" : "text-destructive"}`}>
          {status ? detail : "Vérification des autorisations…"}
        </p>
        {status && !enabled && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("chay-open-media-notification-settings"))}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline underline-offset-2"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            Ouvrir les paramètres Android
          </button>
        )}
      </div>
    </div>
  );
}
