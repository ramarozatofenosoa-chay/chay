import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookMarked, BookOpen, Search } from "lucide-react";
import BibleReader from "@/components/bible/BibleReader";
import BibleDictionary from "@/components/bible/BibleDictionary";
import BibleFullTextSearch from "@/components/bible/BibleFullTextSearch";

export default function Bible() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState(() =>
    searchParams.get("ref") ? "reader" : "home"
  );

  const goHome = () => {
    if (searchParams.get("ref") || searchParams.get("translation") || searchParams.get("verse")) {
      setSearchParams({});
    }
    setView("home");
  };

  // Navigation depuis un résultat de recherche vers le lecteur.
  const openVerse = (r) => {
    const readerVersion = r.translation === "malagasy" ? "MG1865" : "fra_lsg";
    setSearchParams({ translation: readerVersion, ref: `${r.book} ${r.chapter}`, verse: String(r.verse) });
    setView("reader");
  };

  if (view === "reader") return <BibleReader onBack={goHome} />;
  if (view === "dictionary") return <BibleDictionary onBack={() => setView("home")} />;
  if (view === "search") return <BibleFullTextSearch onNavigate={openVerse} onBack={goHome} />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-10">
      <header className="mb-5 flex items-center gap-2.5">
        <div className="rounded-xl bg-primary/10 p-2">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">La Bible</h1>
          <p className="text-xs text-muted-foreground">Choisissez un module pour commencer</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => setView("reader")}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient text-white shadow-sm transition group-hover:scale-105">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-foreground">Lire la Bible</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Texte, recherche et surlignage</p>
          </div>
        </button>

        <button
          onClick={() => setView("dictionary")}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm transition group-hover:scale-105">
            <BookMarked className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-foreground">Dictionnaire</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Dictionnaire biblique</p>
          </div>
        </button>

        <button
          onClick={() => setView("search")}
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient text-white shadow-sm transition group-hover:scale-105">
            <Search className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-foreground">Recherche</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Plein texte dans les 66 livres</p>
          </div>
        </button>
      </div>
    </main>
  );
}