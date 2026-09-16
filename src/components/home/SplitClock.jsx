import React, { useEffect, useState } from "react";

/**
 * Horloge divisée en deux — widget live (se met à jour chaque seconde).
 * Moitié gauche : heure locale. Moitié droite : date du jour.
 * (Scaffold — les détails du contenu exact viendront ensuite.)
 */
export default function SplitClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <section className="mt-4">
      <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden grid grid-cols-2">
        <div className="p-4 text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-foreground/40 mb-1">
            Heure locale
          </div>
          <div className="font-display font-extrabold text-2xl md:text-3xl tabular-nums">
            {time}
          </div>
        </div>
        <div className="p-4 text-center border-l border-border bg-muted/30">
          <div className="text-xs font-bold uppercase tracking-wide text-foreground/40 mb-1">
            Aujourd'hui
          </div>
          <div className="font-display font-bold text-base md:text-lg capitalize">
            {date}
          </div>
        </div>
      </div>
    </section>
  );
}