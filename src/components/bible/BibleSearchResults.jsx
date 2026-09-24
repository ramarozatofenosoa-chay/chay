import React from "react";
import { Loader2 } from "lucide-react";
import { buildHighlightRegex } from "@/lib/bibleSearch";

function Highlighted({ text, query, language }) {
  const regex = query ? buildHighlightRegex(query, language) : null;
  if (!regex) return <>{text}</>;
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-primary/30 px-0.5 text-foreground">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export default function BibleSearchResults({
  query,
  status,
  items,
  total,
  hasMore,
  scopeLabel,
  books,
  translation,
  translationStatus,
  onLoadMore,
  onSelect,
}) {
  const language = translation === "malagasy" ? "mg" : "fr";

  // Affiche un libellé lisible (« Matthieu ») plutôt que le nom brut stocké en
  // base (« MATTHIEU » côté LSG). Repli sur la valeur d'origine si inconnu.
  const labelFor = (order) => books?.find((b) => b.order === order)?.label || null;

  if (status === "idle") return null;
  if (status === "too_short") {
    return <p className="mt-2 text-xs text-muted-foreground">Saisissez au moins 2 caractères pour rechercher.</p>;
  }
  if (status === "error") {
    return <p className="mt-2 text-xs text-destructive">Recherche impossible. Réessayez plus tard.</p>;
  }
  if (translationStatus && translationStatus !== "ready" && translationStatus !== "partial") {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        {translationStatus === "not_configured"
          ? "La recherche dans cette traduction n'est pas encore disponible."
          : "Les données de cette traduction ne sont pas encore synchronisées."}
      </p>
    );
  }

  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-live="polite">
      <div className="border-b border-border bg-muted/50 px-4 py-2.5">
        {status === "loading" && items.length === 0 ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Recherche en cours…
          </span>
        ) : (
          <h2 className="text-xs font-bold text-foreground">
            {total === 0
              ? `Aucun verset trouvé${scopeLabel ? ` dans « ${scopeLabel} »` : ""} pour « ${query} »`
              : `${total} verset(s) trouvé(s)${scopeLabel ? ` dans « ${scopeLabel} »` : ""} pour « ${query} »`}
          </h2>
        )}
      </div>
      {total > 0 && (
        <div className="max-h-[55vh] overflow-y-auto px-3 py-2">
          <ul className="selectable space-y-1">
            {items.map((r, i) => (
              <li key={`${r.bookOrder}-${r.chapter}-${r.verse}-${i}`}>
                <button
                  onClick={() => onSelect(r)}
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-muted transition focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-bold text-primary">{labelFor(r.bookOrder) || r.book} {r.chapter}:{r.verse}</span>
                  <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {r.translation === "malagasy" ? "MG" : "LSG"}
                  </span>
                  <span className="ml-2 text-foreground/80">
                    <Highlighted text={r.text} query={query} language={language} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={status === "loading"}
              className="mt-2 w-full rounded-xl border border-border py-2 text-xs font-bold text-primary hover:bg-muted disabled:opacity-50"
            >
              {status === "loading" ? "Chargement…" : "Charger plus de résultats"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}