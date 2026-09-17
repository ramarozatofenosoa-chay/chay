import React, { useMemo, useState } from "react";
import { BookMarked, ChevronLeft, Search, X } from "lucide-react";
import { BIBLE_DICTIONARY } from "@/lib/bibleDictionary";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function BibleDictionary({ onBack }) {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState(null);

  const filtered = useMemo(() => {
    const q = norm(query);
    return BIBLE_DICTIONARY.filter((e) => {
      const n = norm(e.name);
      if (q) return n.startsWith(q);
      if (activeLetter) return n.startsWith(activeLetter.toLowerCase());
      return true;
    });
  }, [query, activeLetter]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10">
          <ChevronLeft className="h-5 w-5" /> Retour
        </button>
      </div>

      <header className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3">
          <BookMarked className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dictionnaire biblique</h1>
          <p className="text-sm text-muted-foreground">Recherche alphabétique en temps réel</p>
        </div>
      </header>

      {/* Barre de recherche */}
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveLetter(null); }}
          placeholder="Tapez une lettre ou un mot (ex : a, abr, grâce)…"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground selectable"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Barre alphabétique */}
      {!query && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {ALPHABET.map((l) => (
            <button
              key={l}
              onClick={() => setActiveLetter((prev) => (prev === l ? null : l))}
              className={`h-8 w-8 rounded-lg text-sm font-bold transition ${
                activeLetter === l
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/70 hover:bg-primary/10"
              }`}
            >
              {l}
            </button>
          ))}
          {activeLetter && (
            <button onClick={() => setActiveLetter(null)} className="h-8 rounded-lg px-2 text-sm font-bold text-muted-foreground hover:text-foreground">
              Tout
            </button>
          )}
        </div>
      )}

      <p className="mb-3 text-sm text-muted-foreground">
        {filtered.length} entrée(s)
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune entrée ne correspond.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((e) => (
            <article key={e.name} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                <h3 className="text-base font-bold text-primary">{e.name}</h3>
              </div>
              <p className="selectable px-4 py-3 text-sm leading-6 text-foreground/80">{e.text}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}