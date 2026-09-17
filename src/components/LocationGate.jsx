import React, { useEffect, useState } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";

/**
 * Demande la localisation une seule fois. Le résultat (accordé, refusé ou non
 * supporté) est mémorisé : un rafraîchissement de la page ne ré-affiche plus la
 * demande et ne bloque plus l'accès à l'application.
 */
const STORAGE_KEY = "chay_location_status";

export default function LocationGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | requesting | granted | passed

  const request = () => {
    if (!navigator.geolocation) {
      localStorage.setItem(STORAGE_KEY, "unsupported");
      setStatus("passed");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      () => { localStorage.setItem(STORAGE_KEY, "granted"); setStatus("granted"); },
      () => { localStorage.setItem(STORAGE_KEY, "denied"); setStatus("passed"); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // Aperçu du builder (iframe) : on ne verrouille pas.
    if (window.self !== window.top) {
      setStatus("granted");
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted") { setStatus("granted"); return; }
    if (stored === "denied" || stored === "unsupported" || stored === "skipped") {
      setStatus("passed");
      return;
    }
    // Première visite : on demande une seule fois.
    request();
  }, []);

  if (status === "granted" || status === "passed") return children;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 h-16 w-16 rounded-full brand-gradient grid place-items-center text-white">
          {status === "requesting" || status === "checking" ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Navigation className="h-8 w-8" />
          )}
        </div>
        <h1 className="font-display font-extrabold text-2xl text-foreground">
          Localisation requise
        </h1>
        <p className="mt-2 text-sm text-foreground/60 leading-relaxed">
          L'Application Chay souhaite accéder à votre localisation pour afficher
          des annonces pertinentes. Vous pouvez continuer même sans l'activer.
        </p>

        <button
          onClick={request}
          disabled={status === "requesting"}
          className="mt-6 inline-flex items-center gap-2 rounded-full brand-gradient text-white px-6 py-3 text-sm font-bold disabled:opacity-60"
        >
          <MapPin className="h-4 w-4" />
          {status === "requesting" ? "Localisation…" : "Activer ma localisation"}
        </button>
        <button
          onClick={() => { localStorage.setItem(STORAGE_KEY, "skipped"); setStatus("passed"); }}
          className="mt-3 block w-full text-sm font-semibold text-foreground/60 hover:text-foreground"
        >
          Continuer sans localisation
        </button>
      </div>
    </div>
  );
}