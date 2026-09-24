import React from "react";
import { Search, X } from "lucide-react";
import { SEARCH_TRANSLATION_OPTIONS } from "@/lib/bibleSearch";

const STATUS_LABEL = {
  ready: "✓",
  partial: "partiel",
  syncing: "en cours",
  sync_pending: "en attente",
  not_configured: "indisponible",
  error: "erreur",
};

export default function BibleSearchBar({
  query,
  onQueryChange,
  book,
  onBookChange,
  books,
  translation,
  onTranslationChange,
  statuses,
  onClear,
  onSubmit,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder="Rechercher dans la Bible…"
        aria-label="Rechercher dans la Bible"
        maxLength={100}
        className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground selectable"
      />
      {query && (
        <button
          onClick={onClear}
          aria-label="Effacer la recherche"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {/* Concordance : filtre sur un livre (bookOrder) ou sur les 66 livres. */}
      <select
        value={book}
        onChange={(e) => onBookChange(Number(e.target.value))}
        aria-label="Livre à rechercher"
        className="max-w-[9.5rem] shrink-0 rounded-xl border border-border bg-background px-2 py-1.5 text-xs font-semibold outline-none"
      >
        <option value={0}>📖 Tous les livres</option>
        {books.map((b) => (
          <option key={b.order} value={b.order}>
            {b.label}
          </option>
        ))}
      </select>
      <select
        value={translation}
        onChange={(e) => onTranslationChange(e.target.value)}
        aria-label="Traduction pour la recherche"
        className="shrink-0 rounded-xl border border-border bg-background px-2 py-1.5 text-xs font-semibold outline-none"
      >
        {SEARCH_TRANSLATION_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.shortLabel}
            {statuses[o.id] ? ` (${STATUS_LABEL[statuses[o.id]] || statuses[o.id]})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}