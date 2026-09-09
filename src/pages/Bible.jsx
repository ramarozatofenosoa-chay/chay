import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, Search, Loader2, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import DrawerSelect from "@/components/DrawerSelect";

const LSG_BOOKS = [
  { n: "Genèse", u: "01.Genese.html" }, { n: "Exode", u: "02.Exode.html" }, { n: "Lévitique", u: "03.Levitique.html" },
  { n: "Nombres", u: "04.Nombres.html" }, { n: "Deutéronome", u: "05.Deuteronome.html" }, { n: "Josué", u: "06.Josue.html" },
  { n: "Juges", u: "07.Juges.html" }, { n: "Ruth", u: "08.Ruth.html" }, { n: "1 Samuel", u: "09.1Samuel.html" },
  { n: "2 Samuel", u: "10.2Samuel.html" }, { n: "1 Rois", u: "11.1Rois.html" }, { n: "2 Rois", u: "12.2Rois.html" },
  { n: "1 Chroniques", u: "13.1Chroniques.html" }, { n: "2 Chroniques", u: "14.2Chroniques.html" }, { n: "Esdras", u: "15.Esdras.html" },
  { n: "Néhémie", u: "16.Nehemie.html" }, { n: "Esther", u: "17.Esther.html" }, { n: "Job", u: "18.Job.html" },
  { n: "Psaumes", u: "19.Psaumes.html" }, { n: "Proverbes", u: "20.Proverbes.html" }, { n: "Ecclésiaste", u: "21.Ecclesiaste.html" },
  { n: "Cantique", u: "22.Cantique.html" }, { n: "Esaïe", u: "23.Esaie.html" }, { n: "Jérémie", u: "24.Jeremie.html" },
  { n: "Lamentations", u: "25.Lamentations.html" }, { n: "Ezéchiel", u: "26.Ezechiel.html" }, { n: "Daniel", u: "27.Daniel.html" },
  { n: "Osée", u: "28.Osee.html" }, { n: "Joël", u: "29.Joel.html" }, { n: "Amos", u: "30.Amos.html" },
  { n: "Abdias", u: "31.Abdias.html" }, { n: "Jonas", u: "32.Jonas.html" }, { n: "Michée", u: "33.Michee.html" },
  { n: "Nahum", u: "34.Nahum.html" }, { n: "Habacuc", u: "35.Habacuc.html" }, { n: "Sophonie", u: "36.Sophonie.html" },
  { n: "Aggée", u: "37.Aggee.html" }, { n: "Zacharie", u: "38.Zacharie.html" }, { n: "Malachie", u: "39.Malachie.html" },
  { n: "Matthieu", u: "40.Matthieu.html" }, { n: "Marc", u: "41.Marc.html" }, { n: "Luc", u: "42.Luc.html" },
  { n: "Jean", u: "43.Jean.html" }, { n: "Actes", u: "44.Actes.html" }, { n: "Romains", u: "45.Romains.html" },
  { n: "1 Corinthiens", u: "46.1Corinthiens.html" }, { n: "2 Corinthiens", u: "47.2Corinthiens.html" }, { n: "Galates", u: "48.Galates.html" },
  { n: "Ephésiens", u: "49.Ephesiens.html" }, { n: "Philippiens", u: "50.Philippiens.html" }, { n: "Colossiens", u: "51.Colossiens.html" },
  { n: "1 Thessaloniciens", u: "52.1Thessaloniciens.html" }, { n: "2 Thessaloniciens", u: "53.2Thessaloniciens.html" }, { n: "1 Timothée", u: "54.1Timothee.html" },
  { n: "2 Timothée", u: "55.2Timothee.html" }, { n: "Tite", u: "56.Tite.html" }, { n: "Philémon", u: "57.Philemon.html" },
  { n: "Hébreux", u: "58.Hebreux.html" }, { n: "Jacques", u: "59.Jacques.html" }, { n: "1 Pierre", u: "60.1Pierre.html" },
  { n: "2 Pierre", u: "61.2Pierre.html" }, { n: "1 Jean", u: "62.1Jean.html" }, { n: "2 Jean", u: "63.2Jean.html" },
  { n: "3 Jean", u: "64.3Jean.html" }, { n: "Jude", u: "65.Jude.html" }, { n: "Apocalypse", u: "66.Apocalypse.html" },
];

const BASE = "https://www.info-bible.org/lsg/";

/**
 * Parses the plain-text rendering of an info-bible.org LSG page into
 * a list of chapters, each with its own list of {n, text} verses.
 *
 * The page's text content alternates between:
 *   - chapter headers: e.g. "Jean 1", "1 Samuel 3" (no dot, ends in a number)
 *   - verse markers: e.g. "1.1", "3.16" (pure "chapter.verse" digits)
 *   - verse text: one or more lines following a marker
 */
function parseBookText(rawText) {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const verseMarker = /^\d+\.\d+$/;
  const chapterHeader = /^[^\d.][^.]*\s\d+$/; // starts non-digit, no dot, ends in a number

  const chapters = [];
  let currentChapter = null;
  let currentVerse = null;
  let sawFirstChapter = false;

  for (const line of lines) {
    if (chapterHeader.test(line)) {
      const num = parseInt(line.match(/(\d+)$/)?.[1] || "0", 10);
      currentChapter = { num, label: line, verses: [] };
      chapters.push(currentChapter);
      currentVerse = null;
      sawFirstChapter = true;
      continue;
    }
    if (!sawFirstChapter) continue; // skip title/meta lines before ch. 1

    if (verseMarker.test(line)) {
      const [, v] = line.split(".");
      currentVerse = { n: parseInt(v, 10), text: "" };
      currentChapter?.verses.push(currentVerse);
      continue;
    }

    // continuation of the current verse's text
    if (currentVerse) {
      currentVerse.text = currentVerse.text ? `${currentVerse.text} ${line}` : line;
    }
  }

  return chapters.filter((c) => c.verses.length > 0);
}

export default function Bible() {
  const [book, setBook] = useState("43.Jean.html");
  const [query, setQuery] = useState("");
  const [chapters, setChapters] = useState([]);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const isMobile = useIsMobile();
  const bookOptions = LSG_BOOKS.map((b) => ({ value: b.u, label: b.n }));

  const filtered = query
    ? LSG_BOOKS.filter((b) => b.n.toLowerCase().includes(query.toLowerCase()))
    : LSG_BOOKS;

  const currentName = LSG_BOOKS.find((b) => b.u === book)?.n || "Index";

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setChapters([]);
    setChapterIdx(0);

    fetch(BASE + book)
      .then((res) => {
        if (!res.ok) throw new Error("network");
        return res.text();
      })
      .then((html) => {
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const text = doc.body?.innerText || doc.body?.textContent || "";
        const parsed = parseBookText(text);
        if (!parsed.length) throw new Error("parse");
        setChapters(parsed);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [book]);

  const currentChapter = chapters[chapterIdx];

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-6">
        <h1 className="display-fluid">La <span className="brand-gradient-text">Bible</span> (LSG)</h1>
        <p className="mt-3 text-lg text-foreground/60">Version Louis Segond 1910 — en français.</p>
      </header>

      {/* Mobile book picker */}
      {isMobile && (
        <div className="mb-4">
          <DrawerSelect
            value={book}
            options={bookOptions}
            onChange={setBook}
            placeholder="Choisir un livre"
            title="Livres de la Bible"
            description="Version Louis Segond 1910"
            searchable
            triggerClassName="w-full justify-between"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop book list */}
        {!isMobile && (
          <aside className="lg:col-span-1 rounded-[1.5rem] border border-border bg-card p-5 lg:max-h-[70vh] lg:overflow-y-auto">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 mb-4">
              <Search className="h-4 w-4 text-foreground/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un livre…"
                className="bg-transparent outline-none text-sm font-medium flex-1"
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
              {filtered.map((b) => (
                <button
                  key={b.u}
                  onClick={() => setBook(b.u)}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    book === b.u ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground/75"
                  }`}
                >
                  {b.n}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Reader */}
        <div className="lg:col-span-3 rounded-[1.5rem] border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2 font-display font-bold text-lg">
              <BookOpen className="h-5 w-5 text-primary" /> {currentName}
              {currentChapter ? (
                <span className="text-foreground/40 font-normal">— chapitre {currentChapter.num}</span>
              ) : null}
            </div>
          </div>

          {/* Chapter picker */}
          {status === "ready" && chapters.length > 1 && (
            <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-border max-h-28 overflow-y-auto">
              {chapters.map((c, i) => (
                <button
                  key={c.num}
                  onClick={() => setChapterIdx(i)}
                  className={`min-w-[2.25rem] px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    i === chapterIdx ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground/70"
                  }`}
                >
                  {c.num}
                </button>
              ))}
            </div>
          )}

          <div className="px-5 md:px-8 py-6 h-[60vh] md:h-[70vh] overflow-y-auto">
            {status === "loading" && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-foreground/50">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm font-medium">Chargement du texte…</p>
              </div>
            )}

            {status === "error" && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                <AlertTriangle className="h-6 w-6 text-foreground/40" />
                <p className="text-sm font-medium text-foreground/70">
                  Impossible de charger ce livre pour le moment.
                </p>
                <a
                  href={BASE + book}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Ouvrir sur info-bible.org
                </a>
              </div>
            )}

            {status === "ready" && currentChapter && (
              <div className="max-w-3xl mx-auto space-y-4 text-foreground/85 leading-relaxed">
                {currentChapter.verses.map((v) => (
                  <p key={v.n}>
                    <sup className="mr-1.5 font-bold text-primary text-[0.7em] align-super">{v.n}</sup>
                    {v.text}
                  </p>
                ))}

                <div className="flex items-center justify-between pt-6 mt-6 border-t border-border text-sm">
                  <button
                    disabled={chapterIdx === 0}
                    onClick={() => setChapterIdx((i) => Math.max(0, i - 1))}
                    className="font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
                  >
                    ← Chapitre précédent
                  </button>
                  <button
                    disabled={chapterIdx === chapters.length - 1}
                    onClick={() => setChapterIdx((i) => Math.min(chapters.length - 1, i + 1))}
                    className="font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
                  >
                    Chapitre suivant →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
