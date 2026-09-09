import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Play, Pause, Headphones, Radio, Film, Music, Search, Heart } from "lucide-react";

const TABS = [
  { id: "music", label: "Music", icon: Music },
  { id: "sermons", label: "Prédications", icon: Headphones },
  { id: "videos", label: "Videos", icon: Film },
  { id: "radio", label: "Radio", icon: Radio },
];

export default function Media() {
  const [tab, setTab] = useState("music");
  const [tracks, setTracks] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, s] = await Promise.all([
          base44.entities.MusicTrack.list("-created_date", 20).catch(() => []),
          base44.entities.Sermon.list("-date", 20).catch(() => []),
        ]);
        setTracks(Array.isArray(t) ? t : []);
        setSermons(Array.isArray(s) ? s : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="display-fluid"><span className="brand-gradient-text">Media</span> Library</h1>
        <p className="mt-3 text-lg text-foreground/60">Music, sermons, videos, and live radio.</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <div className="inline-flex flex-wrap rounded-full border border-border bg-card p-1 gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-foreground/40" />
          <input placeholder="Search…" className="bg-transparent outline-none text-sm font-medium flex-1" />
        </div>
      </div>

      {/* Radio */}
      {tab === "radio" && (
        <div className="rounded-[2rem] brand-gradient p-8 md:p-12 text-white text-center glow-primary">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase mb-5">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Live Now
          </div>
          <Radio className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h2 className="font-display font-extrabold text-3xl">CHAY Radio</h2>
          <p className="text-white/80 mt-2">Worship & the Word, 24/7</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-foreground px-8 py-3.5 font-bold hover:scale-105 transition">
            <Play className="h-5 w-5" /> Tune in
          </button>
          <p className="text-white/60 text-xs mt-4">Stream URL pending — connect your provider to go live.</p>
        </div>
      )}

      {/* Music */}
      {tab === "music" && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse" />)
          ) : tracks.length ? (
            tracks.map((t) => (
              <div key={t.id} className="group rounded-[1.5rem] border border-border bg-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="aspect-square rounded-2xl brand-gradient grid place-items-center mb-3 relative overflow-hidden">
                  <Music className="h-8 w-8 text-white/90" />
                  <button
                    onClick={() => setPlaying(playing === t.id ? null : t.id)}
                    className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/20 transition"
                  >
                    {playing === t.id ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition" />}
                  </button>
                </div>
                <div className="font-bold text-sm line-clamp-1">{t.title}</div>
                <div className="text-xs text-foreground/55">{t.artist}</div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-foreground/50">No music uploaded yet.</p>
          )}
        </div>
      )}

      {/* Sermons */}
      {tab === "sermons" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-[1.5rem] bg-card animate-pulse" />)
          ) : sermons.length ? (
            sermons.map((s) => (
              <div key={s.id} className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="h-36 brand-gradient relative grid place-items-center">
                  <Headphones className="h-10 w-10 text-white/90" />
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/40 backdrop-blur px-2.5 py-1 text-xs font-bold text-white">
                    {s.duration_minutes || "—"} min
                  </span>
                </div>
                <div className="p-5">
                  <div className="font-display font-bold text-lg leading-snug line-clamp-2">{s.title}</div>
                  <div className="mt-1 text-sm text-foreground/55 font-medium">{s.speaker} · {s.category || "Sermon"}</div>
                  <button className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2.5 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition">
                    <Play className="h-4 w-4" /> Listen
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-foreground/50">No sermons uploaded yet.</p>
          )}
        </div>
      )}

      {/* Videos */}
      {tab === "videos" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="h-44 brand-gradient grid place-items-center relative">
                <Film className="h-12 w-12 text-white/90" />
                <button className="absolute inset-0 grid place-items-center">
                  <span className="h-14 w-14 rounded-full bg-white/90 grid place-items-center"><Play className="h-6 w-6 text-foreground ml-0.5" /></span>
                </button>
              </div>
              <div className="p-5">
                <div className="font-display font-bold text-lg">Featured teaching {i + 1}</div>
                <div className="text-sm text-foreground/55">Upload your own videos to fill this library.</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}