import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BibleSearchBar from "@/components/bible/BibleSearchBar";
import BibleSearchResults from "@/components/bible/BibleSearchResults";

const PAGE_SIZE = 20;

// Recherche plein texte dans les 66 livres bibliques (LSG + malgache),
// via la fonction backend searchBibleVerses. Déclenchement 300 ms après la
// saisie ou immédiatement avec Entrée ; ignore les réponses obsolètes.
export default function BibleFullTextSearch({ onNavigate, onBack }) {
  const [query, setQuery] = useState("");
  const [translation, setTranslation] = useState("lsg1910");
  const [statuses, setStatuses] = useState({});
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("idle");
  const [translationStatus, setTranslationStatus] = useState(null);
  const latestRequestId = useRef(0);

  useEffect(() => {
    base44.entities.BibleTranslation.list()
      .then((list) => {
        const map = {};
        (Array.isArray(list) ? list : []).forEach((t) => { map[t.translation_id] = t.status; });
        setStatuses(map);
      })
      .catch(() => {});
  }, []);

  async function runSearch(offset, append) {
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (trimmed.replace(/\s/g, "").length < 2) return;
    const requestId = ++latestRequestId.current;
    setStatus("loading");
    try {
      const res = await base44.functions.invoke("searchBibleVerses", {
        query: trimmed,
        translation,
        limit: PAGE_SIZE,
        offset,
      });
      if (requestId !== latestRequestId.current) return; // réponse obsolète ignorée
      const data = res.data || {};
      setTranslationStatus(data.translationStatus || null);
      setTotal(data.total || 0);
      setHasMore(!!data.hasMore);
      setItems((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
      setStatus("done");
    } catch {
      if (requestId !== latestRequestId.current) return;
      setStatus("error");
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.replace(/\s/g, "").length < 2) {
      setStatus(trimmed.length === 0 ? "idle" : "too_short");
      setItems([]);
      setTotal(0);
      return;
    }
    const t = setTimeout(() => runSearch(0, false), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, translation]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10">
          <ChevronLeft className="h-5 w-5" /> Retour
        </button>
      </div>
      <header className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3">
          <Search className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recherche biblique</h1>
          <p className="text-xs text-muted-foreground">Plein texte dans les 66 livres</p>
        </div>
      </header>
      <div className="mb-3">
        <BibleSearchBar
          query={query}
          onQueryChange={setQuery}
          translation={translation}
          onTranslationChange={setTranslation}
          statuses={statuses}
          onClear={() => { setQuery(""); setItems([]); setTotal(0); setStatus("idle"); }}
          onSubmit={() => runSearch(0, false)}
        />
        <BibleSearchResults
          query={query.trim()}
          status={status}
          items={items}
          total={total}
          hasMore={hasMore}
          translation={translation}
          translationStatus={translationStatus}
          onLoadMore={() => runSearch(items.length, true)}
          onSelect={onNavigate}
        />
      </div>
    </main>
  );
}