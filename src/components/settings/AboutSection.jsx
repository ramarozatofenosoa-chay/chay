import React from "react";
import { APP_VERSION } from "@/lib/appVersion";
import { Facebook, Youtube, Globe } from "lucide-react";

export default function AboutSection() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-foreground/70">
        L'Église Chay annonce le Royaume de Dieu et accompagne chaque personne
        dans sa foi à travers la Parole, la louange et la communauté.
      </p>

      <div>
        <p className="font-bold">Vision</p>
        <p className="text-foreground/60">
          Voir des vies transformées par l'Évangile.
        </p>
      </div>
      <div>
        <p className="font-bold">Mission</p>
        <p className="text-foreground/60">
          Tory ny Fanjakan'Andriamanitra — porter la Bonne Nouvelle partout.
        </p>
      </div>
      <div>
        <p className="font-bold">Valeurs</p>
        <p className="text-foreground/60">
          Foi, amour, intégrité, communauté et service.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href="https://www.facebook.com/www.chay.fr"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-semibold hover:border-primary"
        >
          <Facebook className="h-4 w-4 text-primary" /> Facebook
        </a>
        <a
          href="https://www.youtube.com/@EgliseChay.fr-tv"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-semibold hover:border-primary"
        >
          <Youtube className="h-4 w-4 text-primary" /> YouTube
        </a>
        <a
          href="https://www.chay.fr"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-semibold hover:border-primary"
        >
          <Globe className="h-4 w-4 text-primary" /> Site officiel
        </a>
      </div>

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-foreground/60">
        Version {APP_VERSION}
      </div>
    </div>
  );
}