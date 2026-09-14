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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HIGHLIGHT_COLORS, LANGUAGES, VERSIONS } from "@/lib/bibleConstants";
import VerseActionsSheet from "@/components/bible/VerseActionsSheet";

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
  const [selectedVersion, setSelectedVersion] = useState("fra_lsg");
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("JHN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);

  const [booksStatus, setBooksStatus] = useState("loading");
  const [chapterStatus, setChapterStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [annotations, setAnnotations] = useState({});
  const [activeVerse, setActiveVerse] = useState(null);
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
        setSelectedBookId(jean?.id || loaded[0].id);
        setSelectedChapter(1);
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

  const openVerse = (verse) => {
    setActiveVerse(verse);
    setSheetOpen(true);
  };

  const upsert = async (data) => {
    if (!activeVerse) return;
    const existing = annotations[activeVerse.number];
    try {
      if (existing) {
        await base44.entities.BibleAnnotation.update(existing.id, data);
      } else {
        await base44.entities.BibleAnnotation.create({
          translation_id: selectedVersion,
          book_id: selectedBookId,
          chapter: selectedChapter,
          verse: activeVerse.number,
          highlight_color: null,
          note: null,
          ...data,
        });
      }
      await loadAnnotations();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const onHighlight = (colorId) => upsert({ highlight_color: colorId });

  const onNote = (text) => {
    upsert({ note: text.trim() || null });
    toast({ title: "Note enregistrée" });
  };

  const onRemove = async () => {
    const existing = annotations[activeVerse?.number];
    if (existing?.highlight_color) {
      await upsert({ highlight_color: null });
    }
  };

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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_130px]">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Version
                </label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-3 font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {VERSIONS[lang].map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Livre
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => {
                    setSelectedBookId(e.target.value);
                    setSelectedChapter(1);
                  }}
                  className="w-full rounded-xl border border-border bg-card px-3 py-3 font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {booksStatus === "ready" && (
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Chapitre
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-card px-3 py-3 font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {chapterNumbers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
                  Touchez un verset pour le surligner, prendre une note ou le copier.
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
              <div className="space-y-4 text-[1.04rem] leading-8 text-foreground/80">
                {verses.map((verse) => {
                  const ann = annotations[verse.number];
                  const hl = ann?.highlight_color
                    ? HIGHLIGHT_COLORS.find((c) => c.id === ann.highlight_color)
                    : null;
                  return (
                    <p key={verse.number}>
                      <sup className="mr-1.5 text-xs font-bold text-primary">
                        {verse.number}
                      </sup>
                      <span
                        onClick={() => openVerse(verse)}
                        className={`cursor-pointer rounded px-0.5 transition hover:bg-muted ${
                          hl ? hl.verse : ""
                        }`}
                      >
                        {verse.text}
                      </span>
                      {ann?.note && (
                        <button
                          onClick={() => openVerse(verse)}
                          className="inline-flex items-center ml-1 align-middle"
                          aria-label="Note"
                        >
                          <StickyNote className="h-3.5 w-3.5 text-primary" />
                        </button>
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
        verse={activeVerse}
        annotation={activeVerse ? annotations[activeVerse.number] : null}
        onHighlight={onHighlight}
        onNote={onNote}
        onRemove={onRemove}
      />
    </main>
  );
}