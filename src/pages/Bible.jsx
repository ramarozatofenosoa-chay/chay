import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

/*
  Free Use Bible API
  Translation: French Louis Segond 1910
  Translation ID: fra_lsg

  Books:
  https://bible.helloao.org/api/fra_lsg/books.json

  Chapter example:
  https://bible.helloao.org/api/fra_lsg/JHN/3.simple.json
*/
const API_BASE_URL = "https://bible.helloao.org/api";
const TRANSLATION_ID = "fra_lsg";

function getBooksUrl() {
  return `${API_BASE_URL}/${TRANSLATION_ID}/books.json`;
}

function getChapterUrl(bookId, chapterNumber) {
  return `${API_BASE_URL}/${TRANSLATION_ID}/${bookId}/${chapterNumber}.simple.json`;
}

/*
  The simplified endpoint generally returns chapter content in a structure
  containing an array of verses. This helper is deliberately flexible so the
  interface survives small API response-structure variations.
*/
function normalizeChapterResponse(data) {
  const possibleVerseArrays = [
    data?.verses,
    data?.content,
    data?.chapter?.verses,
    data?.data?.verses,
  ];

  const rawVerses = possibleVerseArrays.find(Array.isArray) || [];

  return rawVerses
    .map((verse, index) => {
      if (typeof verse === "string") {
        return {
          number: index + 1,
          text: verse.trim(),
        };
      }

      const verseNumber =
        verse?.number ??
        verse?.verseNumber ??
        verse?.verse ??
        verse?.id ??
        index + 1;

      const verseText =
        verse?.text ??
        verse?.content ??
        verse?.value ??
        verse?.html ??
        "";

      return {
        number: Number(verseNumber) || index + 1,
        text: String(verseText)
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      };
    })
    .filter((verse) => verse.text.length > 0);
}

function normalizeBookResponse(data) {
  const rawBooks = Array.isArray(data)
    ? data
    : data?.books || data?.data || data?.translation?.books || [];

  if (!Array.isArray(rawBooks)) {
    return [];
  }

  return rawBooks
    .map((book, index) => {
      const chapters =
        book?.numberOfChapters ??
        book?.chapters ??
        book?.chapterCount ??
        0;

      return {
        id: book?.id || book?.bookId || book?.abbreviation || "",
        name:
          book?.commonName ||
          book?.name ||
          book?.title ||
          `Livre ${index + 1}`,
        title: book?.title || book?.name || "",
        order: Number(book?.order || index + 1),
        numberOfChapters: Number(chapters) || 1,
      };
    })
    .filter((book) => book.id)
    .sort((firstBook, secondBook) => firstBook.order - secondBook.order);
}

export default function Bible() {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("JHN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [bookSearch, setBookSearch] = useState("");

  const [booksStatus, setBooksStatus] = useState("loading");
  const [chapterStatus, setChapterStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  /*
    Load the list of all 66 books once when the page opens.
  */
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
            `Impossible de charger les livres (HTTP ${response.status}).`,
          );
        }

        const data = await response.json();
        const normalizedBooks = normalizeBookResponse(data);

        if (normalizedBooks.length === 0) {
          console.error("Réponse livres reçue :", data);
          throw new Error("La liste des livres reçue est vide ou invalide.");
        }

        setBooks(normalizedBooks);

        /*
          Default to Jean if it exists in the API response.
        */
        const johnBook = normalizedBooks.find((book) => book.id === "JHN");

        if (johnBook) {
          setSelectedBookId(johnBook.id);
          setSelectedChapter(1);
        } else {
          setSelectedBookId(normalizedBooks[0].id);
          setSelectedChapter(1);
        }

        setBooksStatus("ready");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Erreur de chargement des livres :", error);

        setBooksStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Une erreur inconnue est survenue.",
        );
      }
    }

    loadBooks();

    return () => controller.abort();
  }, []);

  const selectedBook = useMemo(() => {
    return books.find((book) => book.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  const visibleBooks = useMemo(() => {
    const search = bookSearch.trim().toLocaleLowerCase("fr");

    if (!search) {
      return books;
    }

    return books.filter((book) =>
      `${book.name} ${book.title}`
        .toLocaleLowerCase("fr")
        .includes(search),
    );
  }, [books, bookSearch]);

  const chapterNumbers = useMemo(() => {
    const totalChapters = selectedBook?.numberOfChapters || 1;

    return Array.from(
      { length: totalChapters },
      (_, index) => index + 1,
    );
  }, [selectedBook]);

  /*
    Each time the selected book or chapter changes, the text reloads
    automatically.
  */
  useEffect(() => {
    if (!selectedBookId || !selectedChapter || booksStatus !== "ready") {
      return;
    }

    const controller = new AbortController();

    async function loadChapter() {
      setChapterStatus("loading");
      setErrorMessage("");
      setVerses([]);

      try {
        const response = await fetch(
          getChapterUrl(selectedBookId, selectedChapter),
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(
            `Impossible de charger ce chapitre (HTTP ${response.status}).`,
          );
        }

        const data = await response.json();
        const normalizedVerses = normalizeChapterResponse(data);

        if (normalizedVerses.length === 0) {
          console.error("Réponse chapitre reçue :", data);

          throw new Error(
            "Le chapitre a été téléchargé, mais aucun verset n'a été trouvé.",
          );
        }

        setVerses(normalizedVerses);
        setChapterStatus("ready");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Erreur de chargement du chapitre :", error);

        setChapterStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Une erreur inconnue est survenue.",
        );
      }
    }

    loadChapter();

    return () => controller.abort();
  }, [selectedBookId, selectedChapter, booksStatus]);

  function handleBookChange(event) {
    const nextBookId = event.target.value;

    setSelectedBookId(nextBookId);
    setSelectedChapter(1);
    setBookSearch("");
  }

  function handleChapterChange(event) {
    setSelectedChapter(Number(event.target.value));
  }

  function previousChapter() {
    if (selectedChapter > 1) {
      setSelectedChapter((chapter) => chapter - 1);
      return;
    }

    const currentBookIndex = books.findIndex(
      (book) => book.id === selectedBookId,
    );

    if (currentBookIndex <= 0) {
      return;
    }

    const previousBook = books[currentBookIndex - 1];

    setSelectedBookId(previousBook.id);
    setSelectedChapter(previousBook.numberOfChapters);
  }

  function nextChapter() {
    const totalChapters = selectedBook?.numberOfChapters || 1;

    if (selectedChapter < totalChapters) {
      setSelectedChapter((chapter) => chapter + 1);
      return;
    }

    const currentBookIndex = books.findIndex(
      (book) => book.id === selectedBookId,
    );

    if (currentBookIndex === -1 || currentBookIndex >= books.length - 1) {
      return;
    }

    const nextBook = books[currentBookIndex + 1];

    setSelectedBookId(nextBook.id);
    setSelectedChapter(1);
  }

  function retryLoading() {
    /*
      Reloading the page is the simplest reliable retry because it reruns
      both API calls and resets all state cleanly.
    */
    window.location.reload();
  }

  const isFirstChapter =
    books.findIndex((book) => book.id === selectedBookId) === 0 &&
    selectedChapter === 1;

  const isLastChapter =
    books.findIndex((book) => book.id === selectedBookId) === books.length - 1 &&
    selectedChapter === (selectedBook?.numberOfChapters || 1);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-orange-100 p-3">
            <BookOpen className="h-7 w-7 text-orange-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              La Bible
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Louis Segond 1910
            </p>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 md:px-6">
          {booksStatus === "loading" && (
            <div className="flex items-center gap-3 py-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              <span className="text-sm font-medium">
                Chargement des livres de la Bible…
              </span>
            </div>
          )}

          {booksStatus === "error" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Impossible de charger la liste des livres.
              </div>

              <button
                type="button"
                onClick={retryLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          )}

          {booksStatus === "ready" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <label
                  htmlFor="bible-book"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Livre
                </label>

                <select
                  id="bible-book"
                  value={selectedBookId}
                  onChange={handleBookChange}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:w-36">
                <label
                  htmlFor="bible-chapter"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Chapitre
                </label>

                <select
                  id="bible-chapter"
                  value={selectedChapter}
                  onChange={handleChapterChange}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  {chapterNumbers.map((chapterNumber) => (
                    <option key={chapterNumber} value={chapterNumber}>
                      {chapterNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {booksStatus === "ready" && (
          <div className="border-b border-slate-200 px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900">
                  {selectedBook?.name} {selectedChapter}
                </p>

                <p className="mt-0.5 text-sm text-slate-500">
                  Louis Segond 1910
                </p>
              </div>

              <div className="text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                {verses.length > 0
                  ? `${verses.length} versets`
                  : "Chargement"}
              </div>
            </div>
          </div>
        )}

        <div className="min-h-[52vh] px-5 py-7 md:px-10 md:py-9">
          {chapterStatus === "idle" || chapterStatus === "loading" ? (
            <div className="flex min-h-[42vh] flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />

              <p className="text-sm font-medium">
                Chargement de {selectedBook?.name || "la Bible"}…
              </p>
            </div>
          ) : null}

          {chapterStatus === "error" && (
            <div className="flex min-h-[42vh] flex-col items-center justify-center gap-4 text-center">
              <AlertTriangle className="h-9 w-9 text-amber-500" />

              <div>
                <p className="text-sm font-bold text-slate-700">
                  Impossible de charger ce chapitre.
                </p>

                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                  {errorMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={retryLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          )}

          {chapterStatus === "ready" && (
            <article className="mx-auto max-w-3xl">
              <div className="space-y-4 text-[1.04rem] leading-8 text-slate-700">
                {verses.map((verse) => (
                  <p key={verse.number}>
                    <sup className="mr-1.5 text-xs font-bold text-orange-600">
                      {verse.number}
                    </sup>
                    {verse.text}
                  </p>
                ))}
              </div>

              <nav className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={previousChapter}
                  disabled={isFirstChapter}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Précédent
                </button>

                <button
                  type="button"
                  onClick={nextChapter}
                  disabled={isLastChapter}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Suivant
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}