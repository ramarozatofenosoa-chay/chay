import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookMarked, ChevronLeft, Loader2, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DICTIONARY_URL, DICTIONARY_SOURCE, normalizeWord } from "@/lib/bibleDictionary";

const PAGE_SIZE = 60;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_QUERY = 60;

// Dictionnaire biblique Westphal.
// - Navigation alphabétique : on ne charge aucune définition dans le DOM tant
//   qu'une lettre (ou une recherche) n'est pas choisie ; la liste n'affiche que
//   les titres. La définition complète n'apparaît qu'au clic, dans une fiche.
// - Recherche insensible à la casse et aux accents, titres uniquement.
// - Aucun dangerouslySetInnerHTML : tout est rendu en texte brut.
export default function BibleDictionary({ onBack }) {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState(null); // null = chargement, [] = vide
  const [error, setError] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const alphaRef = useRef(null);

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

  // Nettoyage de la requête : trim + longueur max. Aucun HTML interprété
  // (champ text standard, React échappe le contenu).
  const cleanQuery = query.trim().slice(0, MAX_QUERY);
  const normQuery = useMemo(() => normalizeWord(cleanQuery), [cleanQuery]);
  const isSearch = normQuery.length > 0;

  const availableLetters = useMemo(() => {
    const set = new Set();
    (entries || []).forEach((e) => {
      const first = normalizeWord(e.mot).charAt(0);
      if (/[a-z]/.test(first)) set.add(first.toUpperCase());
    });
    return set;
  }, [entries]);

  const letterEntries = useMemo(() => {
    if (!selectedLetter || !entries) return [];
    return entries
      .filter((e) => normalizeWord(e.mot).charAt(0).toUpperCase() === selectedLetter)
      .sort((a, b) => normalizeWord(a.mot).localeCompare(normalizeWord(b.mot)));
  }, [entries, selectedLetter]);

  const searchEntries = useMemo(() => {
    if (!entries || !normQuery) return [];
    return entries
      .filter((e) => normalizeWord(e.mot).includes(normQuery))
      .sort((a, b) => normalizeWord(a.mot).localeCompare(normalizeWord(b.mot)));
  }, [entries, normQuery]);

  const list = isSearch ? searchEntries : selectedLetter ? letterEntries : [];
  const visible = list.slice(0, visibleCount);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedLetter, normQuery]);

  const pickLetter = (l) => {
    setQuery("");
    setSelectedLetter((prev) => (prev === l ? null : l));
  };

  // Navigation clavier dans l'alphabet (flèches gauche/droite).
  const onLetterKey = (e, idx) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + dir + LETTERS.length) % LETTERS.length;
      const root = alphaRef.current;
      if (root) {
        const btns = root.querySelectorAll("button[data-letter]");
        btns[next]?.focus();
      }
    }
  };

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
          placeholder="Rechercher un mot (ex : grâce)…"
          maxLength={MAX_QUERY}
          aria-label="Rechercher dans le dictionnaire"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground selectable"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Effacer" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation alphabétique */}
      {!error && entries && (
        <div
          ref={alphaRef}
          role="toolbar"
          aria-label="Navigation alphabétique"
          className="mb-4 flex md:justify-center gap-1 overflow-x-auto no-scrollbar pb-1"
        >
          {LETTERS.map((l, i) => {
            const has = availableLetters.has(l);
            const active = !isSearch && selectedLetter === l;
            return (
              <button
                key={l}
                data-letter={l}
                disabled={!has}
                onClick={() => has && pickLetter(l)}
                onKeyDown={(e) => onLetterKey(e, i)}
                aria-pressed={active}
                aria-label={`Lettre ${l}${has ? "" : " (aucune entrée)"}`}
                className={`h-9 w-9 shrink-0 rounded-xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  !has
                    ? "text-foreground/20 cursor-not-allowed"
                    : active
                    ? "brand-gradient text-white ring-2 ring-primary ring-offset-1 ring-offset-background underline underline-offset-2"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      )}

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

      {!error && entries && !isSearch && !selectedLetter && (
        <p className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          Choisissez une lettre pour parcourir le dictionnaire.
        </p>
      )}

      {!error && entries && isSearch && searchEntries.length === 0 && (
        <p className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun résultat pour « {cleanQuery} ».
        </p>
      )}

      {!error && entries && !isSearch && selectedLetter && letterEntries.length === 0 && (
        <p className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun mot trouvé pour la lettre « {selectedLetter} ».
        </p>
      )}

      {!error && entries && list.length > 0 && (
        <>
          <p className="mb-3 text-xs font-semibold text-muted-foreground">
            {isSearch
              ? `${list.length} résultat${list.length > 1 ? "s" : ""} pour « ${cleanQuery} »`
              : `${list.length} mot${list.length > 1 ? "s" : ""} commençant par « ${selectedLetter} »`}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {visible.map((e, i) => (
              <li key={`${e.mot}-${i}`}>
                <button
                  onClick={() => setSelectedEntry(e)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <span className="truncate text-sm font-bold text-primary">{e.mot}</span>
                </button>
              </li>
            ))}
          </ul>
          {visible.length < list.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-bold text-primary hover:bg-muted"
            >
              Afficher plus ({list.length - visible.length} restants)
            </button>
          )}
        </>
      )}

      {/* Fiche détaillée */}
      <Dialog open={!!selectedEntry} onOpenChange={(o) => !o && setSelectedEntry(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold text-primary">{selectedEntry.mot}</DialogTitle>
              </DialogHeader>
              <p className="selectable mt-2 text-[0.95rem] leading-7 text-foreground/85">{selectedEntry.def}</p>
              <p className="mt-5 border-t border-border pt-3 text-center text-[11px] italic text-muted-foreground">
                Source : {selectedEntry.src}
              </p>
              <button
                onClick={() => setSelectedEntry(null)}
                className="mt-4 w-full inline-flex items-center justify-center gap-1 rounded-xl border border-border py-2.5 text-sm font-bold text-primary hover:bg-muted transition"
              >
                <ChevronLeft className="h-4 w-4" /> Retour à la liste
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}