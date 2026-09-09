import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Headphones, Search, Bookmark, Highlighter, ChevronRight } from "lucide-react";

const BOOKS = [
  "Genesis", "Exodus", "Psalms", "Proverbs", "Isaiah", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "Revelation",
];

export default function Bible() {
  const [devotionals, setDevotionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBook, setActiveBook] = useState("John");
  const [activeChapter, setActiveChapter] = useState(3);
  const [mode, setMode] = useState("read"); // read | audio

  useEffect(() => {
    (async () => {
      try {
        const d = await base44.entities.Devotional.list("-reading_date", 5);
        setDevotionals(Array.isArray(d) ? d : []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="display-fluid">The <span className="brand-gradient-text">Bible</span></h1>
        <p className="mt-3 text-lg text-foreground/60">Read, listen, highlight, and bookmark — your way.</p>
      </header>

      {/* Mode + search */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {["read", "audio"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition ${
                mode === m ? "bg-primary text-primary-foreground" : "text-foreground/60"
              }`}
            >
              {m === "read" ? "Read" : "Audio Bible"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-foreground/40" />
          <input placeholder="Search a verse or word…" className="bg-transparent outline-none text-sm font-medium flex-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Reader */}
        <div className="lg:col-span-2 rounded-[2rem] border border-border bg-card p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <select
                value={activeBook}
                onChange={(e) => setActiveBook(e.target.value)}
                className="rounded-full border border-border bg-background px-4 py-2 font-bold text-sm outline-none"
              >
                {BOOKS.map((b) => <option key={b}>{b}</option>)}
              </select>
              <select
                value={activeChapter}
                onChange={(e) => setActiveChapter(Number(e.target.value))}
                className="rounded-full border border-border bg-background px-4 py-2 font-bold text-sm outline-none"
              >
                {Array.from({ length: 21 }, (_, i) => i + 1).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted transition"><Bookmark className="h-4 w-4" /></button>
              <button className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted transition"><Highlighter className="h-4 w-4" /></button>
            </div>
          </div>

          {mode === "audio" ? (
            <div className="rounded-3xl brand-gradient p-8 text-white text-center">
              <Headphones className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <div className="font-display font-bold text-xl">{activeBook} {activeChapter}</div>
              <p className="text-white/80 text-sm mt-1">Audio Bible — tap to play</p>
              <button className="mt-6 rounded-full bg-white text-foreground px-8 py-3 font-bold hover:scale-105 transition">▶ Play</button>
            </div>
          ) : (
            <div className="space-y-4 leading-relaxed text-foreground/85 text-lg">
              <p><sup className="font-bold text-primary mr-1">1</sup> Now there was a man of the Pharisees named Nicodemus, a ruler of the Jews.</p>
              <p><sup className="font-bold text-primary mr-1">2</sup> This man came to Jesus by night and said to him, "Rabbi, we know that you are a teacher come from God…"</p>
              <p><sup className="font-bold text-primary mr-1">3</sup> Jesus answered him, "Truly, truly, I say to you, unless one is born again he cannot see the kingdom of God."</p>
              <p className="text-foreground/50 italic text-base pt-2">Sample passage — connect a licensed translation to show full text.</p>
            </div>
          )}
        </div>

        {/* Devotionals sidebar */}
        <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
          <h3 className="font-display font-extrabold text-xl mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Devotionals
          </h3>
          {loading ? (
            <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-20 bg-background rounded-2xl animate-pulse" />)}</div>
          ) : devotionals.length ? (
            <div className="space-y-3">
              {devotionals.map((d) => (
                <div key={d.id} className="rounded-2xl bg-background border border-border p-4 hover:border-primary transition cursor-pointer">
                  <div className="text-xs font-bold text-primary uppercase tracking-wide">{d.scripture_reference}</div>
                  <div className="font-bold mt-1 line-clamp-1">{d.title}</div>
                  <div className="text-sm text-foreground/55 line-clamp-2 mt-1">{d.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Daily devotionals will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}