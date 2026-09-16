import React, { useEffect, useState } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";

/**
 * Bloque le lancement de l'application tant que la localisation n'est pas
 * activée. Re-vérifié à chaque ouverture (le composant reste monté tant que
 * l'utilisateur navigue, donc ne redemande pas à chaque changement de page ;
 * seul un rechargement relance le contrôle).
 */
export default function LocationGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | requesting | granted | denied | unsupported

  const request = () => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      () => setStatus("granted"),
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // Dans l'aperçu du builder (iframe), la géolocalisation est souvent
    // bloquée par le navigateur ; on n'y applique pas le verrou pour garder
    // l'aperçu navigable. L'application publiée (page principale) l'applique.
    if (window.self !== window.top) {
      setStatus("granted");
      return;
    }
    request();
  }, []);

  if (status === "granted") return children;

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
          L'Application Chay a besoin de votre localisation en temps réel pour
          afficher des annonces pertinentes et fonctionner correctement. Elle
          ne peut pas être lancée sans cette autorisation.
        </p>

        {status === "denied" && (
          <p className="mt-4 text-sm font-medium text-destructive">
            Accès refusé. Autorisez la localisation dans votre navigateur, puis
            réessayez.
          </p>
        )}
        {status === "unsupported" && (
          <p className="mt-4 text-sm font-medium text-destructive">
            La géolocalisation n'est pas supportée sur cet appareil.
          </p>
        )}

        <button
          onClick={request}
          disabled={status === "requesting" || status === "checking"}
          className="mt-6 inline-flex items-center gap-2 rounded-full brand-gradient text-white px-6 py-3 text-sm font-bold disabled:opacity-60"
        >
          <MapPin className="h-4 w-4" />
          {status === "requesting" ? "Localisation…" : "Activer ma localisation"}
        </button>
      </div>
    </div>
  );
}