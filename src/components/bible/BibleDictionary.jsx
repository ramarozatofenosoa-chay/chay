import React, { useEffect, useMemo, useState } from "react";
import { Search, X, BookMarked, Loader2 } from "lucide-react";
import { DICTIONARY_URL, DICTIONARY_SOURCE, normalizeWord } from "@/lib/bibleDictionary";

// Cache module : on ne re-télécharge le JSON qu'une fois par session.
let _cache = null; // { entries, byLetter, total }

// ---- Nettoyage heuristique des mots collés à l'import ----
function tidyText(s) {
  return String(s || "")
    .replace(/([\p{Ll}])(\p{Lu})/gu, "$1 $2")        // parAmram -> par Amram
    .replace(/([,;:.!?])(\p{L})/gu, "$1 $2")         // Moise,arrière -> Moise, arrière
    .replace(/([^\s(\[])([(\[])/g, "$1 $2")          // Kéhath(Exode -> Kéhath (Exode
    .replace(/([)\]])([^\s),.;:!?»])/g, "$1 $2")     // )il -> ) il
    .replace(/([»"])(\p{L})/gu, "$1 $2")             // »de -> » de
    .replace(/(\p{L})([«"])/gu, "$1 $2")             // de« -> de «
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
function toParagraphs(s) {
  return tidyText(s)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Lettre de regroupement = 1re lettre du mot NORMALISÉ (champ `n`), jamais du brut.
function letterOf(entry) {
  const c = String(entry.n || normalizeWord(entry.mot) || "").charAt(0).toUpperCase();
  return /^[A-Z]$/.test(c) ? c : "#";
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

export default function BibleDictionary({ onBack }) {
  const [loading, setLoading] = useState(!_cache);
  const [data, setData] = useState(_cache);
  const [active, setActive] = useState(null);   // lettre sélectionnée
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // entrée ouverte en fiche

  // Chargement unique du JSON statique.
  useEffect(() => {
    if (_cache) { setData(_cache); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    fetch(DICTIONARY_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((rows) => {
        if (!alive) return;
        const list = Array.isArray(rows) ? rows : (rows?.entries || []);
        const entries = list
          .map((e) => ({
            id: e.id ?? `${e.mot}_${e.n}`,
            mot: e.mot || "",
            n: e.n || normalizeWord(e.mot),
            d: e.d || "",
            s: e.s || "",
          }))
          .filter((e) => e.mot);
        const byLetter = {};
        for (const e of entries) (byLetter[letterOf(e)] ||= []).push(e);
        for (const k of Object.keys(byLetter))
          byLetter[k].sort((a, b) => a.mot.localeCompare(b.mot, "fr"));
        _cache = { entries, byLetter, total: entries.length };
        setData(_cache);
        setLoading(false);
      })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const total = data?.total || 0;

  // Résultats de recherche (scan complet, 1978 entrées = négligeable).
  const searchResults = useMemo(() => {
    const q = normalizeWord(query);
    if (!q || !data) return [];
    return data.entries
      .filter((e) => e.n.includes(q) || normalizeWord(e.mot).includes(q))
      .slice(0, 200);
  }, [query, data]);

  const listForActive = active ? (data?.byLetter[active] || []) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-4 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10"
        >
          <X className="h-4 w-4 rotate-0" /> Retour
        </button>
      </div>

      <header className="mb-5 flex items-center gap-2.5">
        <div className="rounded-xl bg-primary/10 p-2">
          <BookMarked className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dictionnaire biblique</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Chargement…" : `${DICTIONARY_SOURCE.replace(/\s*\(.*\)/, "")} — ${total} entrées`}
          </p>
        </div>
      </header>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(null); }}
          placeholder="Rechercher un mot (ex : grâce)…"
          className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-10 text-sm outline-none focus:border-primary"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Effacer"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : query ? (
        /* ---- Mode recherche : liste de mots ---- */
        <div className="space-y-1">
          {searchResults.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun résultat.</p>
          ) : (
            searchResults.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className="block w-full rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                {e.mot}
              </button>
            ))
          )}
        </div>
      ) : (
        <>
          {/* ---- Grille de carrés : TOUT l'alphabet visible, sans scroll ---- */}
          <div className="my-4 grid grid-cols-6 gap-2 sm:grid-cols-9">
            {LETTERS.map((L) => {
              const count = data?.byLetter[L]?.length || 0;
              const empty = count === 0;
              const isActive = active === L;
              return (
                <button
                  key={L}
                  type="button"
                  disabled={empty}
                  onClick={() => setActive(L)}
                  aria-label={empty ? `${L} (vide)` : `${L} (${count} entrées)`}
                  className={[
                    "relative aspect-square rounded-xl border font-display font-extrabold text-base transition",
                    "grid place-items-center",
                    isActive
                      ? "brand-gradient scale-[1.03] border-transparent text-white shadow-md"
                      : empty
                      ? "cursor-not-allowed border-border bg-card text-foreground/25"
                      : "border-border bg-card text-foreground hover:border-primary hover:text-primary active:scale-95",
                  ].join(" ")}
                >
                  {L}
                  {!empty && (
                    <span className="absolute bottom-1 right-1.5 text-[9px] font-bold tabular-nums opacity-60">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ---- Liste des mots de la lettre active ---- */}
          {active ? (
            <div className="space-y-1">
              {listForActive.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="block w-full rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  {e.mot}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Choisissez une lettre pour parcourir le dictionnaire.
            </div>
          )}
        </>
      )}

      {/* ---- Fiche détail (overlay plein écran, comme ta capture) ---- */}
      {selected && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-background/98 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative flex items-center justify-center border-b border-border px-4 py-4">
            <h2 className="text-center text-2xl font-extrabold text-primary">{selected.mot}</h2>
            <button
              onClick={() => setSelected(null)}
              aria-label="Fermer"
              className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
            <article className="mx-auto max-w-2xl space-y-4 text-[15px] leading-relaxed text-foreground/85 [hyphens:auto]">
              {toParagraphs(selected.d).map((para, i) => (
                <p key={i} className="text-pretty">
                  {para.split("\n").map((line, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              ))}
            </article>
            {selected.s && (
              <p className="mx-auto mt-6 max-w-2xl border-t border-border pt-3 text-xs italic text-muted-foreground">
                {selected.s}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
