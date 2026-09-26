import React, { useState, useEffect } from "react";
import { MapPin, Loader2, Navigation, X } from "lucide-react";

const STORAGE_KEY = "chay_location_status";

export default function LocationGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [showDenied, setShowDenied] = useState(false);

  useEffect(() => {
    if (window.self !== window.top) {
      setStatus("granted");
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted") {
      setStatus("granted");
    } else if (stored === "skipped") {
      setShowDenied(true);
    } else {
      request();
    }
  }, []);

  const request = () => {
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem(STORAGE_KEY, "granted");
        setStatus("granted");
      },
      () => {
        setShowDenied(true);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  if (status === "requesting") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="font-display font-bold text-xl text-foreground mb-2">
            Localisation requise
          </p>
          <p className="text-sm text-foreground/60">
            L'application Chay a besoin de votre localisation pour fonctionner.
            Veuillez autoriser l'accès.
          </p>
          <button
            onClick={request}
            className="mt-4 inline-flex items-center gap-2 rounded-full brand-gradient text-white px-6 py-3 text-sm font-bold hover:scale-105 transition"
          >
            <MapPin className="h-4 w-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (showDenied || status === "denied") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <X className="h-10 w-10 text-destructive mx-auto mb-4" />
          <p className="font-display font-bold text-xl text-foreground mb-2">
            Localisation obligatoire
          </p>
          <p className="text-sm text-foreground/60 mb-4">
            Pour utiliser l'application Chay, la localisation doit être activée.
            Cette option ne peut pas être désactivée.
          </p>
          <button
            onClick={request}
            className="inline-flex items-center gap-2 rounded-full brand-gradient text-white px-6 py-3 text-sm font-bold hover:scale-105 transition"
          >
            <MapPin className="h-4 w-4" /> Activer la localisation
          </button>
          <p className="mt-3 text-xs text-foreground/40">
            Vous pouvez quitter cette page et réessayer depuis les paramètres
            de votre appareil.
          </p>
        </div>
      </div>
    );
  }

  if (status !== "granted") {
    return null;
  }

  return children;
}
