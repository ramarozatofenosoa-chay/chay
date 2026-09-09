import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "https://bible.helloao.org/api";
const TRANSLATION_ID = "fra_lsg";

function getBooksUrl() {
  return `${API_BASE_URL}/${TRANSLATION_ID}/books.json`;
}

function getChapterUrl(bookId, chapterNumber) {
  return `${API_BASE_URL}/${TRANSLATION_ID}/${bookId}/${chapterNumber}.simple.json`;
}

function normalizeBookResponse(data) {
  const rawBooks = data?.books;

  if (!Array.isArray(rawBooks)) {
    console.error("Format de livres inattendu :", data);
    return [];
  }

  return rawBooks
    .map((book) => ({
      id: book.id,
      name: book.commonName || book.name,
      title: book.title || book.name,
      order: Number(book.order),
      numberOfChapters: Number(book.numberOfChapters),
    }))
    .filter(
      (book) =>
        book.id &&
        book.name &&
        book.numberOfChapters > 0,
    )
    .sort((firstBook, secondBook) => firstBook.order - secondBook.order);
}

function normalizeChapterResponse(data) {
  const content = data?.chapter?.content;

  if (!Array.isArray(content)) {
    console.error("Format de chapitre inattendu :", data);
    return [];
  }

  return content
    .filter((item) => item?.type === "verse")
    .map((verse) => ({
      number: Number(verse.number),
      text: String(verse.text || "")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .filter((verse) => verse.text.length > 0);
}

export default function Bible() {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("JHN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);

  const [booksStatus, setBooksStatus] = useState("loading");
  const [chapterStatus, setChapterStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooks() {
      setBooksStatus("loading");
      setErrorMessage("");

      try {
        const response = await fetch(getBooksUrl(), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Impossible de charger les livres. HTTP ${response.status}.`,
          );
        }

        const data = await response.json();
        const loadedBooks = normalizeBookResponse(data);

        if (loadedBooks.length === 0) {
          throw new Error("Aucun livre n'a été trouvé.");
        }

        setBooks(loadedBooks);

        const jean = loadedBooks.find((book) => book.id === "JHN");
        const firstBook = loadedBooks[0];

        setSelectedBookId(jean?.id || firstBook.id);
        setSelectedChapter(1);
        setBooksStatus("ready");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Erreur lors du chargement des livres :", error);
        setBooksStatus("error");
        setErrorMessage(error.message);
      }
    }

    loadBooks();

    return () => controller.abort();
  }, []);

  const selectedBook = useMemo(() => {
    return books.find((book) => book.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  const chapterNumbers = useMemo(() => {
    const count = selectedBook?.numberOfChapters || 1;

    return Array.from(
      { length: count },
      (_, index) => index + 1,
    );
  }, [selectedBook]);

  useEffect(() => {
    if (
      booksStatus !== "ready" ||
      !selectedBookId ||
      !selectedChapter
    ) {
      return;
    }

    const controller = new AbortController();

    async function loadChapter() {
      setChapterStatus("loading");
      setVerses([]);
      setErrorMessage("");

      try {
        const url = getChapterUrl(selectedBookId, selectedChapter);
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Impossible de charger le chapitre. HTTP ${response.status}.`,
          );
        }

        const data = await response.json();
        const loadedVerses = normalizeChapterResponse(data);

        if (loadedVerses.length === 0) {
          throw new Error(
            "Le chapitre a été reçu, mais aucun verset n'a été trouvé.",
          );
        }

        setVerses(loadedVerses);
        setChapterStatus("ready");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Erreur lors du chargement du chapitre :", error);
        setChapterStatus("error");
        setErrorMessage(error.message);
      }
    }

    loadChapter();

    return () => controller.abort();
  }, [booksStatus, selectedBookId, selectedChapter]);

  function handleBookChange(event) {
    setSelectedBookId(event.target.value);
    setSelectedChapter(1);
  }

  function handleChapterChange(event) {
    setSelectedChapter(Number(event.target.value));
  }

  function goToPreviousChapter() {
    if (selectedChapter > 1) {
      setSelectedChapter((value) => value - 1);
      return;
    }

    const currentIndex = books.findIndex(
      (book) => book.id === selectedBookId,
    );

    if (currentIndex > 0) {
      const previousBook = books[currentIndex - 1];

      setSelectedBookId(previousBook.id);
      setSelectedChapter(previousBook.numberOfChapters);
    }
  }

  function goToNextChapter() {
    const totalChapters = selectedBook?.numberOfChapters || 1;

    if (selectedChapter < totalChapters) {
      setSelectedChapter((value) => value + 1);
      return;
    }

    const currentIndex = books.findIndex(
      (book) => book.id === selectedBookId,
    );

    if (currentIndex < books.length - 1) {
      const nextBook = books[currentIndex + 1];

      setSelectedBookId(nextBook.id);
      setSelectedChapter(1);
    }
  }

  function retry() {
    window.location.reload();
  }

  const currentBookIndex = books.findIndex(
    (book) => book.id === selectedBookId,
  );

  const isFirstChapter =
    currentBookIndex === 0 && selectedChapter === 1;

  const isLastChapter =
    currentBookIndex === books.length - 1 &&
    selectedChapter === selectedBook?.numberOfChapters;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">
            La Bible
          </h1>

          <p className="text-sm text-muted-foreground">
            Louis Segond 1910
          </p>
        </div>
      </header>

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
              <p className="text-sm text-destructive">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          )}

          {booksStatus === "ready" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_130px]">
              <div>
                <label
                  htmlFor="book-select"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground"
                >
                  Livre
                </label>

                <select
                  id="book-select"
                  value={selectedBookId}
                  onChange={handleBookChange}
                  className="w-full rounded-xl border border-border bg-card px-3 py-3 font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="chapter-select"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground"
                >
                  Chapitre
                </label>

                <select
                  id="chapter-select"
                  value={selectedChapter}
                  onChange={handleChapterChange}
                  className="w-full rounded-xl border border-border bg-card px-3 py-3 font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {chapterNumbers.map((chapter) => (
                    <option key={chapter} value={chapter}>
                      {chapter}
                    </option>
                  ))}
                </select>
              </div>
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
                  Louis Segond 1910
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

              <p className="text-sm font-medium">
                Chargement du chapitre…
              </p>
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
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          )}

          {chapterStatus === "ready" && (
            <article className="mx-auto max-w-3xl">
              <div className="space-y-4 text-[1.04rem] leading-8 text-foreground/80">
                {verses.map((verse) => (
                  <p key={verse.number}>
                    <sup className="mr-1.5 text-xs font-bold text-primary">
                      {verse.number}
                    </sup>

                    {verse.text}
                  </p>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
                <button
                  type="button"
                  onClick={goToPreviousChapter}
                  disabled={isFirstChapter}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Précédent
                </button>

                <button
                  type="button"
                  onClick={goToNextChapter}
                  disabled={isLastChapter}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Suivant
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}