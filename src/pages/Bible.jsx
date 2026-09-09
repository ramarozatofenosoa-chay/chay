import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

const LSG_BOOKS = [
  { name: "Genèse", file: "01.Genese.html" },
  { name: "Exode", file: "02.Exode.html" },
  { name: "Lévitique", file: "03.Levitique.html" },
  { name: "Nombres", file: "04.Nombres.html" },
  { name: "Deutéronome", file: "05.Deuteronome.html" },
  { name: "Josué", file: "06.Josue.html" },
  { name: "Juges", file: "07.Juges.html" },
  { name: "Ruth", file: "08.Ruth.html" },
  { name: "1 Samuel", file: "09.1Samuel.html" },
  { name: "2 Samuel", file: "10.2Samuel.html" },
  { name: "1 Rois", file: "11.1Rois.html" },
  { name: "2 Rois", file: "12.2Rois.html" },
  { name: "1 Chroniques", file: "13.1Chroniques.html" },
  { name: "2 Chroniques", file: "14.2Chroniques.html" },
  { name: "Esdras", file: "15.Esdras.html" },
  { name: "Néhémie", file: "16.Nehemie.html" },
  { name: "Esther", file: "17.Esther.html" },
  { name: "Job", file: "18.Job.html" },
  { name: "Psaumes", file: "19.Psaumes.html" },
  { name: "Proverbes", file: "20.Proverbes.html" },
  { name: "Ecclésiaste", file: "21.Ecclesiaste.html" },
  { name: "Cantique des cantiques", file: "22.Cantique.html" },
  { name: "Ésaïe", file: "23.Esaie.html" },
  { name: "Jérémie", file: "24.Jeremie.html" },
  { name: "Lamentations", file: "25.Lamentations.html" },
  { name: "Ézéchiel", file: "26.Ezechiel.html" },
  { name: "Daniel", file: "27.Daniel.html" },
  { name: "Osée", file: "28.Osee.html" },
  { name: "Joël", file: "29.Joel.html" },
  { name: "Amos", file: "30.Amos.html" },
  { name: "Abdias", file: "31.Abdias.html" },
  { name: "Jonas", file: "32.Jonas.html" },
  { name: "Michée", file: "33.Michee.html" },
  { name: "Nahum", file: "34.Nahum.html" },
  { name: "Habacuc", file: "35.Habacuc.html" },
  { name: "Sophonie", file: "36.Sophonie.html" },
  { name: "Aggée", file: "37.Aggee.html" },
  { name: "Zacharie", file: "38.Zacharie.html" },
  { name: "Malachie", file: "39.Malachie.html" },
  { name: "Matthieu", file: "40.Matthieu.html" },
  { name: "Marc", file: "41.Marc.html" },
  { name: "Luc", file: "42.Luc.html" },
  { name: "Jean", file: "43.Jean.html" },
  { name: "Actes", file: "44.Actes.html" },
  { name: "Romains", file: "45.Romains.html" },
  { name: "1 Corinthiens", file: "46.1Corinthiens.html" },
  { name: "2 Corinthiens", file: "47.2Corinthiens.html" },
  { name: "Galates", file: "48.Galates.html" },
  { name: "Éphésiens", file: "49.Ephesiens.html" },
  { name: "Philippiens", file: "50.Philippiens.html" },
  { name: "Colossiens", file: "51.Colossiens.html" },
  { name: "1 Thessaloniciens", file: "52.1Thessaloniciens.html" },
  { name: "2 Thessaloniciens", file: "53.2Thessaloniciens.html" },
  { name: "1 Timothée", file: "54.1Timothee.html" },
  { name: "2 Timothée", file: "55.2Timothee.html" },
  { name: "Tite", file: "56.Tite.html" },
  { name: "Philémon", file: "57.Philemon.html" },
  { name: "Hébreux", file: "58.Hebreux.html" },
  { name: "Jacques", file: "59.Jacques.html" },
  { name: "1 Pierre", file: "60.1Pierre.html" },
  { name: "2 Pierre", file: "61.2Pierre.html" },
  { name: "1 Jean", file: "62.1Jean.html" },
  { name: "2 Jean", file: "63.2Jean.html" },
  { name: "3 Jean", file: "64.3Jean.html" },
  { name: "Jude", file: "65.Jude.html" },
  { name: "Apocalypse", file: "66.Apocalypse.html" },
];

/*
  The final slash is essential.

  Correct:
  https://www.info-bible.org/lsg/43.Jean.html

  Incorrect:
  https://www.info-bible.org/lsg43.Jean.html
*/
const INFO_BIBLE_BASE_URL = "https://www.info-bible.org/lsg/";

/*
  Reads the plain text extracted from the Info-Bible HTML page.

  It supports either:
  - "1.1" followed by the verse text
  - "1 Au commencement..." where chapter changes are detected
*/
function parseBookText(rawText) {
  const lines = rawText
    .split("\n")
    .map((line) => line.replace(/\u00a0/g, " ").trim())
    .filter(Boolean);

  const chapters = [];
  let currentChapter = null;
  let currentVerse = null;

  const chapterTitlePattern = /^(.+?)\s+(\d+)$/;
  const chapterVersePattern = /^(\d+)\.(\d+)\s*(.*)$/;
  const versePattern = /^(\d+)\s+(.+)$/;

  for (const line of lines) {
    const chapterTitleMatch = line.match(chapterTitlePattern);

    /*
      Examples:
      "Jean 1"
      "1 Samuel 3"

      We only accept it as a chapter title if it does not begin
      with a pure numeric verse reference.
    */
    if (
      chapterTitleMatch &&
      !/^\d+(\.\d+)?/.test(line) &&
      !line.includes("http")
    ) {
      const chapterNumber = Number(chapterTitleMatch[2]);

      currentChapter = {
        number: chapterNumber,
        title: line,
        verses: [],
      };

      chapters.push(currentChapter);
      currentVerse = null;
      continue;
    }

    /*
      Example:
      "3.16 Car Dieu a tant aimé le monde..."
    */
    const chapterVerseMatch = line.match(chapterVersePattern);

    if (chapterVerseMatch) {
      const chapterNumber = Number(chapterVerseMatch[1]);
      const verseNumber = Number(chapterVerseMatch[2]);
      const verseText = chapterVerseMatch[3]?.trim() || "";

      if (
        !currentChapter ||
        currentChapter.number !== chapterNumber
      ) {
        currentChapter = {
          number: chapterNumber,
          title: `Chapitre ${chapterNumber}`,
          verses: [],
        };

        chapters.push(currentChapter);
      }

      currentVerse = {
        number: verseNumber,
        text: verseText,
      };

      currentChapter.verses.push(currentVerse);
      continue;
    }

    /*
      Example:
      "16 Car Dieu a tant aimé le monde..."
      This only works once a chapter has already been recognized.
    */
    const verseMatch = line.match(versePattern);

    if (currentChapter && verseMatch) {
      currentVerse = {
        number: Number(verseMatch[1]),
        text: verseMatch[2].trim(),
      };

      currentChapter.verses.push(currentVerse);
      continue;
    }

    /*
      If a verse continues on the following line, append it.
    */
    if (currentVerse && line.length > 1) {
      currentVerse.text = `${currentVerse.text} ${line}`.trim();
    }
  }

  return chapters.filter((chapter) => chapter.verses.length > 0);
}

export default function Bible() {
  const [selectedBookFile, setSelectedBookFile] = useState("43.Jean.html");
  const [bookSearch, setBookSearch] = useState("");
  const [chapters, setChapters] = useState([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const currentBook = useMemo(() => {
    return LSG_BOOKS.find((book) => book.file === selectedBookFile);
  }, [selectedBookFile]);

  const filteredBooks = useMemo(() => {
    const normalizedSearch = bookSearch.trim().toLocaleLowerCase("fr");

    if (!normalizedSearch) {
      return LSG_BOOKS;
    }

    return LSG_BOOKS.filter((book) =>
      book.name.toLocaleLowerCase("fr").includes(normalizedSearch),
    );
  }, [bookSearch]);

  const currentChapter = chapters[chapterIndex];
  const sourceUrl = `${INFO_BIBLE_BASE_URL}${selectedBookFile}`;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadBook() {
      setStatus("loading");
      setErrorMessage("");
      setChapters([]);
      setChapterIndex(0);

      try {
        const response = await fetch(sourceUrl, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Le serveur a répondu avec le statut HTTP ${response.status}.`,
          );
        }

        const html = await response.text();

        if (cancelled) {
          return;
        }

        const documentFromPage = new DOMParser().parseFromString(
          html,
          "text/html",
        );

        const extractedText =
          documentFromPage.body?.innerText ||
          documentFromPage.body?.textContent ||
          "";

        const parsedChapters = parseBookText(extractedText);

        if (parsedChapters.length === 0) {
          console.warn(
            "Aucun chapitre n'a été reconnu. Début du texte reçu :",
            extractedText.slice(0, 1000),
          );

          throw new Error(
            "Le texte a été téléchargé, mais son format n'a pas pu être lu.",
          );
        }

        if (!cancelled) {
          setChapters(parsedChapters);
          setStatus("ready");
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Erreur lors du chargement de la Bible :", error);

        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Une erreur inconnue s'est produite.";

          setErrorMessage(message);
          setStatus("error");
        }
      }
    }

    loadBook();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sourceUrl]);

  function selectBook(bookFile) {
    setSelectedBookFile(bookFile);
    setBookSearch("");
  }

  function goToPreviousChapter() {
    setChapterIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function goToNextChapter() {
    setChapterIndex((currentIndex) =>
      Math.min(chapters.length - 1, currentIndex + 1),
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
          <BookOpen className="h-8 w-8 text-orange-500" />
          La Bible LSG
        </h1>

        <p className="mt-2 text-sm text-slate-500 md:text-base">
          Version Louis Segond 1910 en français
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <label
            htmlFor="book-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Livres de la Bible
          </label>

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />

            <input
              id="book-search"
              type="search"
              value={bookSearch}
              onChange={(event) => setBookSearch(event.target.value)}
              placeholder="Rechercher un livre"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto pr-1 lg:grid-cols-1">
            {filteredBooks.map((book) => {
              const isSelected = book.file === selectedBookFile;

              return (
                <button
                  key={book.file}
                  type="button"
                  onClick={() => selectBook(book.file)}
                  className={[
                    "rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                    isSelected
                      ? "bg-orange-500 text-white"
                      : "text-slate-700 hover:bg-orange-50 hover:text-orange-700",
                  ].join(" ")}
                >
                  {book.name}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 md:px-7">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <BookOpen className="h-5 w-5 text-orange-500" />
                {currentBook?.name || "Bible"}
              </h2>

              {status === "ready" && currentChapter && (
                <p className="mt-1 text-sm text-slate-500">
                  Chapitre {currentChapter.number}
                </p>
              )}
            </div>

            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:underline"
            >
              Ouvrir la source
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {status === "ready" && chapters.length > 1 && (
            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto border-b border-slate-200 px-5 py-3 md:px-7">
              {chapters.map((chapter, index) => {
                const isCurrentChapter = index === chapterIndex;

                return (
                  <button
                    key={`${chapter.number}-${index}`}
                    type="button"
                    onClick={() => setChapterIndex(index)}
                    className={[
                      "min-w-9 rounded-lg px-2.5 py-1.5 text-xs font-bold transition",
                      isCurrentChapter
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700",
                    ].join(" ")}
                  >
                    {chapter.number}
                  </button>
                );
              })}
            </div>
          )}

          <div className="h-[60vh] overflow-y-auto px-5 py-6 md:h-[65vh] md:px-8">
            {status === "loading" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
                <p className="text-sm font-medium">Chargement du texte…</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />

                <p className="text-sm font-semibold text-slate-700">
                  Impossible de charger ce livre pour le moment.
                </p>

                <p className="max-w-md text-xs leading-relaxed text-slate-500">
                  {errorMessage ||
                    "Le serveur peut bloquer les requêtes provenant de votre application."}
                </p>

                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:underline"
                >
                  Ouvrir sur info-bible.org
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {status === "ready" && currentChapter && (
              <article className="mx-auto max-w-3xl">
                <h3 className="mb-6 text-2xl font-bold text-slate-900">
                  {currentBook?.name} {currentChapter.number}
                </h3>

                <div className="space-y-4 text-[1.02rem] leading-8 text-slate-700">
                  {currentChapter.verses.map((verse) => (
                    <p key={verse.number}>
                      <sup className="mr-1.5 text-xs font-bold text-orange-600">
                        {verse.number}
                      </sup>
                      {verse.text}
                    </p>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={goToPreviousChapter}
                    disabled={chapterIndex === 0}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 transition hover:underline disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Chapitre précédent
                  </button>

                  <button
                    type="button"
                    onClick={goToNextChapter}
                    disabled={chapterIndex === chapters.length - 1}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 transition hover:underline disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Chapitre suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}