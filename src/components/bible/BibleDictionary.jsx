import React, { useEffect, useMemo, useState } from "react";
import { BookMarked, ChevronLeft, Loader2, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DICTIONARY_URL, DICTIONARY_SOURCE, normalizeWord } from "@/lib/bibleDictionary";

const PAGE_SIZE = 80;

// Dictionnaire biblique Westphal (1978 entrées). Recherche temps réel
// insensible à la casse/accents ; clic → carte détaillée élégante.
export default function BibleDictionary({ onBack }) {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState(null); // null = chargement, [] = vide
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    fetch(DICTIONARY_URL)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        if (!alive) return;
        const list = (Array.isArray(data) ? data : [])
          .map((e) => ({ mot: e.mot, def: e.d, src: e.s || DICTIONARY_SOURCE }))
          .filter((e) => e.mot && e.def);
        setEntries(list);
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  const normQuery = useMemo(() => normalizeWord(query), [query]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    if (!normQuery) return entries;
    return entries.filter((e) => {
      const n = normalizeWord(e.mot);
      return n.startsWith(normQuery) || n.includes(" " + normQuery) || n.includes(normQuery);
    });
  }, [entries, normQuery]);

  const visible = filtered.slice(0, visibleCount);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
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
          <h1 className="text-2xl font-bold text-foreground">Dictionnaire biblique</h1>
          <p className="text-xs text-muted-foreground">Westphal — {entries ? `${entries.length} entrées` : "chargement…"}</p>
        </div>
      </header>

      {/* Barre de recherche */}
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Rechercher un mot (ex : grâce)…"
          aria-label="Rechercher dans le dictionnaire"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground selectable"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Effacer" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          Impossible de charger le dictionnaire. Vérifiez votre connexion et réessayez.
        </p>
      )}

      {!error && entries === null && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Chargement du dictionnaire…
        </div>
      )}

      {!error && entries && filtered.length === 0 && (
        <p className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Mot non trouvé dans le dictionnaire. Essayez un autre terme.
        </p>
      )}

      {!error && entries && filtered.length > 0 && (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {visible.map((e, i) => (
              <li key={`${e.mot}-${i}`}>
                <button
                  onClick={() => setSelected(e)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/60 focus-visible:bg-muted/60"
                >
                  <span className="truncate text-sm font-bold text-primary">{e.mot}</span>
                  <span className="ml-2 shrink-0 truncate text-xs text-muted-foreground">{e.def.slice(0, 60)}…</span>
                </button>
              </li>
            ))}
          </ul>
          {visible.length < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-bold text-primary hover:bg-muted"
            >
              Afficher plus ({filtered.length - visible.length} restants)
            </button>
          )}
        </>
      )}

      {/* Carte détaillée */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold text-primary">{selected.mot}</DialogTitle>
              </DialogHeader>
              <p className="selectable mt-2 text-[0.95rem] leading-7 text-foreground/85">{selected.def}</p>
              <p className="mt-5 border-t border-border pt-3 text-center text-[11px] italic text-muted-foreground">
                Source : {selected.src}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}