import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, MapPinOff, RefreshCw } from "lucide-react";
import { probeLocationStatus, subscribeToGeolocationPermission } from "@/lib/locationGate";

const RECHECK_INTERVAL_MS = 6000;

// Bloque l'accès à l'application tant que la localisation de l'appareil
// n'est pas activée (service + permission), que l'on soit en ligne ou hors
// ligne : la vérification repose uniquement sur l'API Geolocation du
// navigateur/WebView, jamais sur le réseau.
export default function LocationGate({ children }) {
  const [status, setStatus] = useState("active"); // active | checking | denied | inactive | unsupported
  const timerRef = useRef(null);

  const check = useCallback(async () => {
    const result = await probeLocationStatus();
    setStatus(result);
    return result;
  }, []);

  useEffect(() => {
    check();
    const unsubscribe = subscribeToGeolocationPermission((state) => {
      // Si la permission est accordée via l'API Permissions, on met à jour
      // immédiatement sans attendre la prochaine sonde getCurrentPosition.
      if (state === "granted") {
        setStatus("active");
      } else if (state === "denied") {
        setStatus("denied");
      }
    });
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  // Re-sonde périodiquement tant que l'accès est bloqué, pour reprendre dès
  // que l'utilisateur réactive la localisation sans avoir à revenir dans l'app.
  useEffect(() => {
    if (status === "active" || status === "checking") return undefined;
    timerRef.current = setInterval(check, RECHECK_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [status, check]);

  if (status === "active") return children;

  const messages = {
    denied: "L'accès à la localisation a été refusé. Autorisez-la dans les réglages de votre appareil ou de votre navigateur pour continuer.",
    inactive: "Le service de localisation est désactivé. Activez-le dans les réglages de votre appareil pour continuer.",
    unsupported: "Votre appareil ou navigateur ne prend pas en charge la localisation, requise pour utiliser l'application.",
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <MapPinOff className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Localisation requise</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {messages[status] || messages.inactive}
      </p>
      <button
        onClick={check}
        className="inline-flex items-center gap-2 rounded-2xl brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:scale-[1.02]"
      >
        <RefreshCw className="h-4 w-4" /> Réessayer
      </button>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <MapPin className="h-3.5 w-3.5" /> Disponible en ligne comme hors connexion
      </p>
    </div>
  );
}
