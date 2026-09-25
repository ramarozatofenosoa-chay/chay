import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookMarked, BookOpen, Search } from "lucide-react";
import BibleReader from "@/components/bible/BibleReader";
import BibleDictionary from "@/components/bible/BibleDictionary";
import BibleFullTextSearch from "@/components/bible/BibleFullTextSearch";

// Les sous-écrans sont décrits dans l'URL (?view=reader|dictionary|search) et
// non dans un useState : chaque module pousse donc une entrée d'historique et
// le bouton retour du téléphone revient au module précédent, au lieu de sauter
// directement à l'accueil.
const VIEWS = ["reader", "dictionary", "search"];

export default function Bible() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const viewParam = searchParams.get("view");
  const view = VIEWS.includes(viewParam)
    ? viewParam
    : // Arrivée directe sur un verset (lien ?ref=…) sans ?view= : lecteur.
      searchParams.get("ref")
      ? "reader"
      : "home";

  // Retour : on dépile l'entrée qu'on vient de pousser. Si on est arrivé
  // directement sur ?ref= (aucune entrée propre), on remplace par le menu.
  const goBack = () => {
    if (viewParam) navigate(-1);
    else setSearchParams({}, { replace: true });
  };

  const openView = (v) => {
    if (view === v) return;
    setSearchParams({ view: v });
  };

  // Navigation depuis un résultat de recherche vers le lecteur.
  const openVerse = (r) => {
    const readerVersion = r.translation === "malagasy" ? "MG1865" : "fra_lsg";
    setSearchParams({
      view: "reader",
      translation: readerVersion,
      ref: `${r.book} ${r.chapter}`,
      verse: String(r.verse),
    });
  };

  if (view === "reader") return <BibleReader onBack={goBack} />;
  if (view === "dictionary") return <BibleDictionary onBack={goBack} />;
  if (view === "search") return <BibleFullTextSearch onNavigate={openVerse} onBack={goBack} />;

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

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          onClick={() => openView("reader")}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient text-white shadow-sm transition group-hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-foreground">Lire la Bible</h2>
            <p className="text-[11px] text-muted-foreground">Texte & surlignage</p>
          </div>
        </button>

        <button
          onClick={() => openView("dictionary")}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm transition group-hover:scale-105">
            <BookMarked className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-foreground">Dictionnaire</h2>
            <p className="text-[11px] text-muted-foreground">Dictionnaire biblique</p>
          </div>
        </button>

        <button
          onClick={() => openView("search")}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient text-white shadow-sm transition group-hover:scale-105">
            <Search className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-foreground">Recherche</h2>
            <p className="text-[11px] text-muted-foreground">Plein texte, 66 livres</p>
          </div>
        </button>
      </div>
    </main>
  );
}
