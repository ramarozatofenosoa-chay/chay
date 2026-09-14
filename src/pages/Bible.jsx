import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  StickyNote,
  Highlighter,
  Copy,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HIGHLIGHT_COLORS, LANGUAGES, VERSIONS } from "@/lib/bibleConstants";
import VerseActionsSheet from "@/components/bible/VerseActionsSheet";
import DrawerSelect from "@/components/DrawerSelect";

const API_BASE_URL = "https://bible.helloao.org/api";

function getBooksUrl(translationId) {
  return `${API_BASE_URL}/${translationId}/books.json`;
}

function getChapterUrl(translationId, bookId, chapterNumber) {
  return `${API_BASE_URL}/${translationId}/${bookId}/${chapterNumber}.simple.json`;
}

function normalizeBookResponse(data) {
  const rawBooks = data?.books;
  if (!Array.isArray(rawBooks)) return [];
  return rawBooks
    .map((book) => ({
      id: book.id,
      name: book.commonName || book.name,
      order: Number(book.order),
      numberOfChapters: Number(book.numberOfChapters),
    }))
    .filter((book) => book.id && book.name && book.numberOfChapters > 0)
    .sort((a, b) => a.order - b.order);
}

function normalizeChapterResponse(data) {
  const content = data?.chapter?.content;
  if (!Array.isArray(content)) return [];
  return content
    .filter((item) => item?.type === "verse")
    .map((verse) => ({
      number: Number(verse.number),
      text: String(verse.text || "").replace(/\s+/g, " ").trim(),
    }))
    .filter((verse) => verse.text.length > 0);
}

export default function Bible() {
  const { toast } = useToast();
  const [lang, setLang] = useState("fr");
  const [selectedVersion, setSelectedVersion] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("translation");
    return t || "fra_lsg";
  });
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("JHN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [pendingRef, setPendingRef] = useState(() =>
    new URLSearchParams(window.location.search).get("ref")
  );

  const [booksStatus, setBooksStatus] = useState("loading");
  const [chapterStatus, setChapterStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [annotations, setAnnotations] = useState({});
  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Load books when version changes
  useEffect(() => {
    const controller = new AbortController();
    async function loadBooks() {
      setBooksStatus("loading");
      setErrorMessage("");
      try {
        const res = await fetch(getBooksUrl(selectedVersion), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const loaded = normalizeBookResponse(data);
        if (loaded.length === 0) throw new Error("Aucun livre trouvé.");
        setBooks(loaded);
        const jean = loaded.find((b) => b.id === "JHN");
        let nextBookId = jean?.id || loaded[0].id;
        let nextChapter = 1;
        if (pendingRef) {
          const norm = (s) =>
            s
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, " ")
              .trim();
          const m = pendingRef.trim().match(/^(.*?)\s+(\d+)(?::\d+)?$/);
          if (m) {
            const book = loaded.find((b) => norm(b.name) === norm(m[1]));
            if (book) {
              nextBookId = book.id;
              nextChapter = Number(m[2]);
            }
          }
          setPendingRef(null);
        }
        setSelectedBookId(nextBookId);
        setSelectedChapter(nextChapter);
        setBooksStatus("ready");
      } catch (e) {
        if (e.name === "AbortError") return;
        setBooksStatus("error");
        setErrorMessage(e.message);
      }
    }
    loadBooks();
    return () => controller.abort();
  }, [selectedVersion]);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  const chapterNumbers = useMemo(() => {
    const count = selectedBook?.numberOfChapters || 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selectedBook]);

  // Load chapter + annotations
  useEffect(() => {
    if (booksStatus !== "ready" || !selectedBookId || !selectedChapter) return;
    const controller = new AbortController();
    async function loadChapter() {
      setChapterStatus("loading");
      setVerses([]);
      setErrorMessage("");
      try {
        const res = await fetch(
          getChapterUrl(selectedVersion, selectedBookId, selectedChapter),
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const loaded = normalizeChapterResponse(data);
        if (loaded.length === 0)
          throw new Error("Aucun verset trouvé pour ce chapitre.");
        setVerses(loaded);
        setChapterStatus("ready");
      } catch (e) {
        if (e.name === "AbortError") return;
        setChapterStatus("error");
        setErrorMessage(e.message);
      }
    }
    loadChapter();
    loadAnnotations();
    return () => controller.abort();
  }, [booksStatus, selectedVersion, selectedBookId, selectedChapter]);

  const loadAnnotations = async () => {
    if (!selectedVersion || !selectedBookId || !selectedChapter) return;
    const anns = await base44.entities.BibleAnnotation.filter(
      { translation_id: selectedVersion, book_id: selectedBookId, chapter: selectedChapter },
      "-verse",
      200
    ).catch(() => []);
    const map = {};
    (Array.isArray(anns) ? anns : []).forEach((a) => {
      map[a.verse] = a;
    });
    setAnnotations(map);
  };

  const toggleVerse = (n) =>
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );

  const selectedVerses = selected
    .map((n) => verses.find((v) => v.number === n))
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);

  const copySelected = async () => {
    if (selectedVerses.length === 0) return;
    try {
      await navigator.clipboard.writeText(
        selectedVerses.map((v) => `${v.number}. ${v.text}`).join("\n")
      );
      toast({ title: `${selectedVerses.length} verset(s) copié(s)` });
    } catch {
      toast({ title: "Copie impossible" });
    }
  };

  const upsertMany = async (data) => {
    if (selectedVerses.length === 0) return;
    try {
      await Promise.all(
        selectedVerses.map(async (v) => {
          const existing = annotations[v.number];
          if (existing) {
            await base44.entities.BibleAnnotation.update(existing.id, data);
          } else {
            await base44.entities.BibleAnnotation.create({
              translation_id: selectedVersion,
              book_id: selectedBookId,
              chapter: selectedChapter,
              verse: v.number,
              highlight_color: null,
              note: null,
              ...data,
            });
          }
        })
      );
      await loadAnnotations();
      setSelected([]);
      setSheetOpen(false);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const onHighlight = (colorId) => upsertMany({ highlight_color: colorId });

  const onNote = (text) => {
    upsertMany({ note: text.trim() || null });
    toast({ title: "Note enregistrée" });
  };

  const onRemove = async () => upsertMany({ highlight_color: null });

  // Clear selection when navigating chapters
  useEffect(() => {
    setSelected([]);
    setSheetOpen(false);
  }, [selectedVersion, selectedBookId, selectedChapter]);

  function handleLangChange(newLang) {
    setLang(newLang);
    setSelectedVersion(VERSIONS[newLang][0].id);
  }

  function goToPreviousChapter() {
    if (selectedChapter > 1) {
      setSelectedChapter((v) => v - 1);
      return;
    }
    const idx = books.findIndex((b) => b.id === selectedBookId);
    if (idx > 0) {
      setSelectedBookId(books[idx - 1].id);
      setSelectedChapter(books[idx - 1].numberOfChapters);
    }
  }

  function goToNextChapter() {
    const total = selectedBook?.numberOfChapters || 1;
    if (selectedChapter < total) {
      setSelectedChapter((v) => v + 1);
      return;
    }
    const idx = books.findIndex((b) => b.id === selectedBookId);
    if (idx < books.length - 1) {
      setSelectedBookId(books[idx + 1].id);
      setSelectedChapter(1);
    }
  }

  const currentBookIndex = books.findIndex((b) => b.id === selectedBookId);
  const isFirstChapter = currentBookIndex === 0 && selectedChapter === 1;
  const isLastChapter =
    currentBookIndex === books.length - 1 &&
    selectedChapter === selectedBook?.numberOfChapters;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">La Bible</h1>
          <p className="text-sm text-muted-foreground">
            {VERSIONS[lang].find((v) => v.id === selectedVersion)?.label}
          </p>
        </div>
      </header>

      {/* Language tabs */}
      <div className="mb-3 flex gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => handleLangChange(l.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
              lang === l.id
                ? "bg-primary text-primary-foreground"
                : "border border-border text-foreground/70 hover:bg-muted"
            }`}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/50 px-4 py-4 md:px-6">
          {booksStatus === "loading" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Chargement des livres…
            </div>
          )}
          {booksStatus === "error" && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
              >
                <RefreshCw className="h-4 w-4" /> Réessayer
              </button>
            </div>
          )}
          {booksStatus === "ready" && (
            <div className="flex flex-wrap gap-2">
              <DrawerSelect
                value={selectedVersion}
                onChange={setSelectedVersion}
                title="Version"
                options={VERSIONS[lang].map((v) => ({ label: v.label, value: v.id }))}
              />
              <DrawerSelect
                value={selectedBookId}
                onChange={(v) => {
                  setSelectedBookId(v);
                  setSelectedChapter(1);
                }}
                title="Livre"
                searchable
                options={books.map((b) => ({ label: b.name, value: b.id }))}
              />
              <DrawerSelect
                value={selectedChapter}
                onChange={(v) => setSelectedChapter(Number(v))}
                title="Chapitre"
                options={chapterNumbers.map((c) => ({ label: `Chapitre ${c}`, value: c }))}
              />
            </div>
          )}
        </div>

        {booksStatus === "ready" && (
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {selectedBook?.name} {selectedChapter}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Touchez un ou plusieurs versets pour les sélectionner, puis surlignez, notez ou copiez.
                </p>
              </div>
              {chapterStatus === "loading" && (
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Chargement
                </span>
              )}
            </div>
          </div>
        )}

        <div className="min-h-[52vh] px-5 py-7 md:px-10 md:py-9">
          {chapterStatus === "loading" && (
            <div className="flex min-h-[42vh] flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Chargement du chapitre…</p>
            </div>
          )}
          {chapterStatus === "error" && (
            <div className="flex min-h-[42vh] flex-col items-center justify-center gap-4 text-center">
              <AlertTriangle className="h-9 w-9 text-primary" />
              <div>
                <p className="font-bold text-foreground/80">
                  Impossible de charger ce chapitre.
                </p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground"
              >
                <RefreshCw className="h-4 w-4" /> Réessayer
              </button>
            </div>
          )}
          {chapterStatus === "ready" && (
            <article className="mx-auto max-w-3xl">
              <div className="selectable space-y-4 text-[1.04rem] leading-8 text-foreground/80">
                {verses.map((verse) => {
                  const ann = annotations[verse.number];
                  const hl = ann?.highlight_color
                    ? HIGHLIGHT_COLORS.find((c) => c.id === ann.highlight_color)
                    : null;
                  const isSelected = selected.includes(verse.number);
                  return (
                    <p
                      key={verse.number}
                      onClick={() => toggleVerse(verse.number)}
                      className={`cursor-pointer rounded px-0.5 transition hover:bg-muted ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <sup className="mr-1.5 text-xs font-bold text-primary">
                        {verse.number}
                      </sup>
                      <span
                        className={`rounded px-0.5 ${
                          isSelected
                            ? "bg-primary/20 ring-1 ring-primary/40"
                            : hl
                            ? hl.verse
                            : ""
                        }`}
                      >
                        {verse.text}
                      </span>
                      {ann?.note && (
                        <StickyNote className="inline h-3.5 w-3.5 text-primary ml-1 align-middle" />
                      )}
                    </p>
                  );
                })}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
                <button
                  onClick={goToPreviousChapter}
                  disabled={isFirstChapter}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" /> Précédent
                </button>
                <button
                  onClick={goToNextChapter}
                  disabled={isLastChapter}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Suivant <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </article>
          )}
        </div>
      </section>

      <VerseActionsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        verses={selectedVerses}
        annotations={annotations}
        onHighlight={onHighlight}
        onNote={onNote}
        onRemove={onRemove}
      />

      {selected.length > 0 && (
        <div className="fixed left-0 right-0 z-30 px-4 bottom-[88px] md:bottom-6">
          <div className="mx-auto max-w-sm flex items-center justify-center gap-2 rounded-[1.5rem] border border-border bg-background/95 backdrop-blur-xl shadow-lg px-3 py-2.5">
            <button
              onClick={() => setSheetOpen(true)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl brand-gradient text-white shadow-sm hover:scale-105 transition"
            >
              <Highlighter className="h-5 w-5" />
              <span className="text-[11px] font-bold">Surligner</span>
            </button>
            <button
              onClick={copySelected}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border border-border hover:bg-muted transition"
            >
              <Copy className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-bold">Copier</span>
            </button>
            <button
              onClick={() => setSheetOpen(true)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border border-border hover:bg-muted transition"
            >
              <StickyNote className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-bold">Notes</span>
            </button>
            <button
              onClick={() => setSelected([])}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border border-border hover:bg-muted transition"
            >
              <X className="h-5 w-5 text-foreground/60" />
              <span className="text-[11px] font-bold">Annuler</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}