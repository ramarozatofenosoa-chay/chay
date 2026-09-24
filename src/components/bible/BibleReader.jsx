import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  StickyNote,
  Highlighter,
  Copy,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HIGHLIGHT_COLORS, LANGUAGES, VERSIONS } from "@/lib/bibleConstants";
import VerseActionsSheet from "@/components/bible/VerseActionsSheet";
import DrawerSelect from "@/components/DrawerSelect";
import { getMalagasyBooks, fetchMalagasyChapter } from "@/lib/malagasyBible";
import BibleAudioPlayer from "@/components/bible/BibleAudioPlayer";

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

// Extrait tous les versets d'un Bible complet (format complete.simple.json)
function extractVersesFromComplete(data) {
  const books = data?.books;
  const out = [];
  if (Array.isArray(books)) {
    books.forEach((b) => {
      const chapters = b.chapters || [];
      chapters.forEach((ch) => {
        const content = ch?.content || [];
        content.forEach((item) => {
          if (item?.type === "verse") {
            const txt = String(item.text || "").replace(/\s+/g, " ").trim();
            if (txt.length) {
              out.push({
                bookId: b.id,
                bookName: b.commonName || b.name,
                chapter: Number(ch.number),
                verse: Number(item.number),
                text: txt,
              });
            }
          }
        });
      });
    });
  }
  return out;
}

// Échappe une chaîne pour usage dans une RegExp.
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Correspondance nom de livre français (avec accents/variantes) → identifiant
// helloao (OSIS). Les références des dévotionnels sont en français, alors que
// l'API helloao renvoie des noms anglais (John, Philippians…) : sans cette
// table, le lien « Lire le chapitre » tombait toujours sur Jean 1.
const FR_BOOK_TO_ID = {
  genese: "GEN", exode: "EXO", levitique: "LEV", nombres: "NUM", deuteronomique: "DEU",
  josue: "JOS", juges: "JDG", ruth: "RUT",
  "1 samuel": "1SA", "2 samuel": "2SA", "1 rois": "1KI", "2 rois": "2KI",
  "1 chroniques": "1CH", "2 chroniques": "2CH", esdras: "EZR", nehemie: "NEH", esther: "EST",
  job: "JOB", psaumes: "PSA", psaume: "PSA", proverbes: "PRO", ecclesiaste: "ECC",
  cantique: "SNG", "cantique des cantiques": "SNG",
  esaie: "ISA", jeremie: "JER", lamentations: "LAM", ezechiel: "EZK", daniel: "DAN",
  osee: "HOS", joel: "JOL", amos: "AMO", abdias: "OBA", jonas: "JON",
  michee: "MIC", nahum: "NAM", habacuc: "HAB", sophonie: "ZEP", aggee: "HAG",
  zacharie: "ZEC", malachie: "MAL",
  matthieu: "MAT", marc: "MRK", luc: "LUK", jean: "JHN", actes: "ACT",
  romains: "ROM", "1 corinthiens": "1CO", "2 corinthiens": "2CO", galates: "GAL",
  ephesiens: "EPH", philippiens: "PHP", colossiens: "COL",
  "1 thessaloniciens": "1TH", "2 thessaloniciens": "2TH",
  "1 timothee": "1TI", "2 timothee": "2TI", tite: "TIT", philemon: "PHM",
  hebreux: "HEB", jacques: "JAS",
  "1 pierre": "1PE", "2 pierre": "2PE",
  "1 jean": "1JN", "2 jean": "2JN", "3 jean": "3JN", jude: "JUD",
  apocalypse: "REV",
};

export default function BibleReader({ onBack }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const didInitRef = useRef(false);
  const [lang, setLang] = useState("fr");
  const [selectedVersion, setSelectedVersion] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("translation");
    const known = t && Object.values(VERSIONS).flat().some((v) => v.id === t);
    return known ? t : "fra_lsg";
  });
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("JHN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [pendingRef, setPendingRef] = useState(() =>
    new URLSearchParams(window.location.search).get("ref")
  );
  const [pendingVerse, setPendingVerse] = useState(() => {
    const v = new URLSearchParams(window.location.search).get("verse");
    return v ? Number(v) : null;
  });
  const [highlightVerse, setHighlightVerse] = useState(null);

  const [booksStatus, setBooksStatus] = useState("loading");
  const [chapterStatus, setChapterStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [annotations, setAnnotations] = useState({});
  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Recherche plein texte
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | loading | done | error
  const bibleCacheRef = useRef({});
  const searchControllerRef = useRef(null);

  useEffect(() => {
    const meta = Object.values(VERSIONS).flat().find((v) => v.id === selectedVersion);
    if (!meta || !meta.available) {
      setBooks([]);
      setVerses([]);
      setBooksStatus("unavailable");
      return;
    }
    const norm = (s) =>
      (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
    const resolveInitial = (loaded, defaultId) => {
      let nextBookId = defaultId;
      let nextChapter = 1;
      if (pendingRef) {
        const m = pendingRef.trim().match(/^(.*?)\s+(\d+)(?::(\d+))?$/);
        if (m) {
          // Normalise "1er/1ère/1re Rois" → "1 rois" avant la recherche.
          let rawBook = norm(m[1]).replace(/^(\d)\s*(?:er|ere|re|eme|ème)\s*/, "$1 ");
          const frId = FR_BOOK_TO_ID[rawBook];
          const book = frId
            ? loaded.find((b) => b.id === frId)
            : loaded.find((b) => norm(b.name) === rawBook || norm(b.id) === rawBook);
          if (book) { nextBookId = book.id; nextChapter = Number(m[2]); }
          if (m[3]) setPendingVerse(Number(m[3]));
        }
        setPendingRef(null);
      } else if (!didInitRef.current) {
        const savedBook = user?.bible_last_book && loaded.find((b) => b.id === user.bible_last_book);
        const savedChapter = Number(user?.bible_last_chapter);
        if (savedBook) nextBookId = savedBook.id;
        if (savedChapter >= 1 && savedChapter <= (savedBook?.numberOfChapters || 0)) nextChapter = savedChapter;
      }
      didInitRef.current = true;
      return { nextBookId, nextChapter };
    };

    // Version malgache : catalogue local (API antonionavira, pas de fetch de liste).
    if (meta.engine === "antonionavira") {
      const loaded = getMalagasyBooks();
      const { nextBookId, nextChapter } = resolveInitial(
        loaded,
        loaded.find((b) => b.id === "matio")?.id || loaded[0].id
      );
      setBooks(loaded);
      setSelectedBookId(nextBookId);
      setSelectedChapter(nextChapter);
      setBooksStatus("ready");
      return;
    }

    // Version helloao (LSG) : fetch de la liste des livres.
    const controller = new AbortController();
    async function loadBooks() {
      setBooksStatus("loading");
      setErrorMessage("");
      try {
        const res = await fetch(getBooksUrl(selectedVersion), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const loaded = normalizeBookResponse(data);
        if (loaded.length === 0) throw new Error("Aucun livre trouvé.");
        const { nextBookId, nextChapter } = resolveInitial(
          loaded,
          loaded.find((b) => b.id === "JHN")?.id || loaded[0].id
        );
        setBooks(loaded);
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

  const selectedBook = useMemo(() => books.find((b) => b.id === selectedBookId) || null, [books, selectedBookId]);
  const chapterNumbers = useMemo(() => {
    const count = selectedBook?.numberOfChapters || 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selectedBook]);

  const ALL_VERSIONS = useMemo(() => Object.values(VERSIONS).flat(), []);
  const versionMeta = useMemo(
    () => ALL_VERSIONS.find((v) => v.id === selectedVersion) || null,
    [ALL_VERSIONS, selectedVersion]
  );

    useEffect(() => {
    if (booksStatus !== "ready" || !selectedBookId || !selectedChapter) return;
    
    const controller = new AbortController();
    
    async function loadChapter() {
      setChapterStatus("loading");
      setVerses([]);
      setErrorMessage("");
      
      try {
        let loaded;
        
        // --- LOGIQUE SPÉCIALE POUR LA BIBLE MALGACHE (CACHE LOCALSTORAGE) ---
        if (versionMeta?.engine === "antonionavira") {
          if (!selectedBook) throw new Error("Livre introuvable.");
          
          // 1. Créer une clé unique pour ce chapitre malgache
          const cacheKey = `bible_mg_${selectedBook.id}_${selectedChapter}`;
          
          // 2. Vérifier si on a déjà ces données en mémoire locale
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            console.log("✅ Chargé depuis le cache local (Malgache)");
            loaded = JSON.parse(cachedData);
          } else {
            // 3. Sinon, appeler la fonction lente originale
            console.log("🔄 Appel API Malgache (lent)...");
            loaded = await fetchMalagasyChapter(selectedBook, selectedChapter);
            
            // 4. Sauvegarder immédiatement dans le cache pour la prochaine fois
            try {
              localStorage.setItem(cacheKey, JSON.stringify(loaded));
              console.log("💾 Données sauvegardées en cache");
            } catch (e) {
              console.warn("Cache plein", e);
            }
          }
        } 
        // --- FIN LOGIQUE MALGACHE ---
        
        else {
          // Logique standard HelloAO (rapide)
          const res = await fetch(getChapterUrl(selectedVersion, selectedBookId, selectedChapter), { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          loaded = normalizeChapterResponse(data);
        }

        if (!loaded || loaded.length === 0) throw new Error("Aucun verset trouvé pour ce chapitre.");
        
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
  }, [booksStatus, selectedVersion, selectedBookId, selectedChapter, versionMeta, selectedBook]);
  
  useEffect(() => {
    if (chapterStatus !== "ready" || !user?.id) return;
    base44.auth.updateMe({ bible_last_book: selectedBookId, bible_last_chapter: selectedChapter }).catch(() => {});
  }, [chapterStatus, selectedBookId, selectedChapter, user?.id]);

  // Surligne temporairement le verset ciblé après navigation depuis la recherche.
  useEffect(() => {
    if (chapterStatus !== "ready" || pendingVerse == null) return;
    const v = pendingVerse;
    setPendingVerse(null);
    setHighlightVerse(v);
    const el = document.getElementById(`verse-${v}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlightVerse(null), 3500);
    return () => clearTimeout(t);
  }, [chapterStatus, pendingVerse]);

  const loadAnnotations = async () => {
    if (!selectedVersion || !selectedBookId || !selectedChapter) return;
    const anns = await base44.entities.BibleAnnotation.filter(
      { translation_id: selectedVersion, book_id: selectedBookId, chapter: selectedChapter },
      "-verse", 200
    ).catch(() => []);
    const map = {};
    (Array.isArray(anns) ? anns : []).forEach((a) => { map[a.verse] = a; });
    setAnnotations(map);
  };

  const toggleVerse = (n) => setSelected((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
  const selectedVerses = selected.map((n) => verses.find((v) => v.number === n)).filter(Boolean).sort((a, b) => a.number - b.number);

  const copySelected = async () => {
    if (selectedVerses.length === 0) return;
    try {
      await navigator.clipboard.writeText(selectedVerses.map((v) => `${v.number}. ${v.text}`).join("\n"));
      toast({ title: `${selectedVerses.length} verset(s) copié(s)` });
    } catch { toast({ title: "Copie impossible" }); }
  };

  const upsertMany = async (data) => {
    if (selectedVerses.length === 0) return;
    try {
      await Promise.all(selectedVerses.map(async (v) => {
        const existing = annotations[v.number];
        if (existing) await base44.entities.BibleAnnotation.update(existing.id, data);
        else await base44.entities.BibleAnnotation.create({
          translation_id: selectedVersion, book_id: selectedBookId, chapter: selectedChapter, verse: v.number,
          highlight_color: null, note: null, ...data,
        });
      }));
      await loadAnnotations();
      setSelected([]);
      setSheetOpen(false);
    } catch (e) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };
  const onHighlight = (colorId) => upsertMany({ highlight_color: colorId });
  const onNote = async (text) => {
    await upsertMany({ note: text.trim() || null });
    toast({ title: "Note enregistrée" });
  };
  const onRemove = async () => upsertMany({ highlight_color: null });

  useEffect(() => { setSelected([]); setSheetOpen(false); }, [selectedVersion, selectedBookId, selectedChapter]);

  function handleLangChange(newLang) {
    setLang(newLang);
    setSelectedVersion(VERSIONS[newLang][0].id);
    setSearchInput("");
    setSearchResults([]);
    setSearchStatus("idle");
  }

  function goToPreviousChapter() {
    if (selectedChapter > 1) { setSelectedChapter((v) => v - 1); return; }
    const idx = books.findIndex((b) => b.id === selectedBookId);
    if (idx > 0) { setSelectedBookId(books[idx - 1].id); setSelectedChapter(books[idx - 1].numberOfChapters); }
  }
  function goToNextChapter() {
    const total = selectedBook?.numberOfChapters || 1;
    if (selectedChapter < total) { setSelectedChapter((v) => v + 1); return; }
    const idx = books.findIndex((b) => b.id === selectedBookId);
    if (idx < books.length - 1) { setSelectedBookId(books[idx + 1].id); setSelectedChapter(1); }
  }

  const currentBookIndex = books.findIndex((b) => b.id === selectedBookId);
  const isFirstChapter = currentBookIndex === 0 && selectedChapter === 1;
  const isLastChapter = currentBookIndex === books.length - 1 && selectedChapter === selectedBook?.numberOfChapters;

  // ---- Recherche plein texte ----
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

  async function runSearch(query) {
    const q = query.trim();
    if (!q) { setSearchResults([]); setSearchStatus("idle"); return; }
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (words.length === 0) { setSearchResults([]); setSearchStatus("idle"); return; }
    setSearchStatus("loading");
    // Annule toute recherche précédente (et son téléchargement) en cours.
    if (searchControllerRef.current) searchControllerRef.current.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    try {
      let all = bibleCacheRef.current[selectedVersion];
      if (!all) {
        const res = await fetch(`${API_BASE_URL}/${selectedVersion}/complete.simple.json`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        all = extractVersesFromComplete(data);
        bibleCacheRef.current[selectedVersion] = all;
      }
      // Correspondance sur limites de mot : "es" ne matche plus "les"/"est".
      const patterns = words.map((w) => new RegExp(`\\b${escapeRegex(w)}\\b`));
      const results = [];
      for (let i = 0; i < all.length && results.length < 200; i++) {
        const t = norm(all[i].text);
        if (patterns.every((p) => p.test(t))) results.push(all[i]);
      }
      if (controller.signal.aborted) return;
      setSearchResults(results);
      setSearchStatus("done");
    } catch (e) {
      if (e.name === "AbortError") return;
      setSearchStatus("error");
    }
  }

  function openSearchResult(r) {
    setSelectedBookId(r.bookId);
    setSelectedChapter(r.chapter);
    setSearchInput("");
    setSearchResults([]);
    setSearchStatus("idle");
  }

  // Recherche live : se déclenche automatiquement pendant la frappe (>= 3 chars).
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 3) { setSearchResults([]); setSearchStatus("idle"); return; }
    if (!versionMeta?.available || versionMeta?.engine !== "helloao") return;
    const t = setTimeout(() => runSearch(q), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, selectedVersion]);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 md:px-8 md:py-10">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10">
          <ChevronLeft className="h-5 w-5" /> Retour
        </button>
      </div>

      <header className="mb-4 flex items-center gap-2.5">
        <div className="rounded-xl bg-primary/10 p-2">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">La Bible</h1>
          <p className="text-xs text-muted-foreground">
            {VERSIONS[lang].find((v) => v.id === selectedVersion)?.label}
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/50 px-3 py-3 md:px-6">
          {booksStatus === "loading" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Chargement des livres…
            </div>
          )}
          {booksStatus === "error" && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
                <RefreshCw className="h-4 w-4" /> Réessayer
              </button>
            </div>
          )}
          {booksStatus === "ready" && (
            <div className="flex flex-nowrap gap-2">
              <DrawerSelect
                value={lang}
                onChange={(v) => handleLangChange(v)}
                title="Langue"
                triggerClassName="flex-1 min-w-0 px-3 py-2 text-xs gap-1.5"
                options={LANGUAGES.map((l) => ({ label: l.label, value: l.id }))}
              />
              <DrawerSelect
                value={selectedBookId}
                onChange={(v) => { setSelectedBookId(v); setSelectedChapter(1); }}
                title="Livre"
                searchable
                triggerClassName="flex-[2] min-w-0 px-3 py-2 text-xs gap-1.5"
                options={books.map((b) => ({ label: b.name, value: b.id }))}
              />
              <DrawerSelect
                value={selectedChapter}
                onChange={(v) => setSelectedChapter(Number(v))}
                title="Chapitre"
                triggerClassName="flex-1 min-w-0 px-3 py-2 text-xs gap-1.5"
                options={chapterNumbers.map((c) => ({ label: String(c), value: c }))}
              />
            </div>
          )}
        </div>

        {booksStatus === "ready" && (
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">{selectedBook?.name} {selectedChapter}</h2>
              </div>
              {chapterStatus === "loading" && (
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chargement</span>
              )}
            </div>
          </div>
        )}

        {booksStatus === "ready" && versionMeta?.audio?.supported && (
          <BibleAudioPlayer
            book={selectedBook}
            chapter={selectedChapter}
            onPrev={!isFirstChapter ? goToPreviousChapter : null}
            onNext={!isLastChapter ? goToNextChapter : null}
          />
        )}

        <div className="min-h-[52vh] px-4 py-5 md:px-10 md:py-9">
          {booksStatus === "unavailable" && (
            <div className="flex min-h-[42vh] flex-col items-center justify-center gap-3 text-center">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <div>
                <p className="font-bold text-foreground/80">
                  La source de cette version n'est pas encore configurée ou autorisée.
                </p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Version : {versionMeta?.label}. Configurez une source biblique autorisée pour afficher le texte.
                </p>
              </div>
            </div>
          )}
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
                <p className="font-bold text-foreground/80">Impossible de charger ce chapitre.</p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground">
                <RefreshCw className="h-4 w-4" /> Réessayer
              </button>
            </div>
          )}
          {chapterStatus === "ready" && (
            <article className="mx-auto max-w-3xl">
              <div className="selectable space-y-3 text-sm md:text-[1.04rem] leading-6 md:leading-8 text-foreground/80">
                {verses.map((verse) => {
                  const ann = annotations[verse.number];
                  const hl = ann?.highlight_color ? HIGHLIGHT_COLORS.find((c) => c.id === ann.highlight_color) : null;
                  const isSelected = selected.includes(verse.number);
                  const isHighlighted = highlightVerse === verse.number;
                  return (
                    <p
                      key={verse.number}
                      id={`verse-${verse.number}`}
                      onClick={() => toggleVerse(verse.number)}
                      className={`cursor-pointer rounded px-0.5 transition hover:bg-muted ${isHighlighted ? "bg-primary/25 ring-1 ring-primary/50" : ""} ${isSelected ? "bg-primary/10" : ""}`}
                    >
                      <sup className="mr-1.5 text-xs font-bold text-primary">{verse.number}</sup>
                      <span className={`rounded px-0.5 ${isSelected ? "bg-primary/20 ring-1 ring-primary/40" : hl ? hl.verse : ""}`}>
                        {verse.text}
                      </span>
                      {ann?.note && <StickyNote className="inline h-3.5 w-3.5 text-primary ml-1 align-middle" />}
                    </p>
                  );
                })}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
                <button onClick={goToPreviousChapter} disabled={isFirstChapter} className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30">
                  <ChevronLeft className="h-5 w-5" /> Précédent
                </button>
                <button onClick={goToNextChapter} disabled={isLastChapter} className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30">
                  Suivant <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </article>
          )}
        </div>
      </section>

      <VerseActionsSheet
        open={sheetOpen} onOpenChange={setSheetOpen} verses={selectedVerses} annotations={annotations}
        onHighlight={onHighlight} onNote={onNote} onRemove={onRemove}
      />

      {selected.length > 0 && (
        <div className="fixed left-0 right-0 z-30 px-4 bottom-[88px] md:bottom-6">
          <div className="mx-auto max-w-sm flex items-center justify-center gap-2 rounded-[1.5rem] border border-border bg-background/95 backdrop-blur-xl shadow-lg px-3 py-2.5">
            <button onClick={() => setSheetOpen(true)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl brand-gradient text-white shadow-sm hover:scale-105 transition">
              <Highlighter className="h-5 w-5" /><span className="text-[11px] font-bold">Surligner</span>
            </button>
            <button onClick={copySelected} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border border-border hover:bg-muted transition">
              <Copy className="h-5 w-5 text-primary" /><span className="text-[11px] font-bold">Copier</span>
            </button>
            <button onClick={() => setSheetOpen(true)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border border-border hover:bg-muted transition">
              <StickyNote className="h-5 w-5 text-primary" /><span className="text-[11px] font-bold">Notes</span>
            </button>
            <button onClick={() => setSelected([])} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border border-border hover:bg-muted transition">
              <X className="h-5 w-5 text-foreground/60" /><span className="text-[11px] font-bold">Annuler</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
