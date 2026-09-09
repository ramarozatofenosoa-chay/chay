import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import MediaUploader from "@/components/MediaUploader";
import { Play, Pause, Headphones, Radio, Film, Music, Search, Upload, ExternalLink } from "lucide-react";

const TABS = [
  { id: "music", label: "Musique", icon: Music },
  { id: "sermons", label: "Prédications", icon: Headphones },
  { id: "videos", label: "Vidéos", icon: Film },
  { id: "radio", label: "Radio", icon: Radio },
];

export default function Media() {
  const [tab, setTab] = useState("music");
  const [tracks, setTracks] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [user, setUser] = useState(null);
  const [showUploader, setShowUploader] = useState(false);

  const loadAll = async () => {
    const [t, s, v] = await Promise.all([
      base44.entities.MusicTrack.list("-created_date", 30).catch(() => []),
      base44.entities.Sermon.list("-date", 30).catch(() => []),
      base44.entities.Video.list("-created_date", 30).catch(() => []),
    ]);
    setTracks(Array.isArray(t) ? t : []);
    setSermons(Array.isArray(s) ? s : []);
    setVideos(Array.isArray(v) ? v : []);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me().catch(() => null);
        setUser(me);
        await loadAll();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-fluid"><span className="brand-gradient-text">Médiathèque</span></h1>
          <p className="mt-3 text-lg text-foreground/60">Musique, prédications, vidéos et radio en direct.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowUploader(true)} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 font-bold glow-primary hover:scale-105 transition">
            <Upload className="h-4 w-4" /> Importer
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <div className="inline-flex flex-wrap rounded-full border border-border bg-card p-1 gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                }`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-foreground/40" />
          <input placeholder="Rechercher…" className="bg-transparent outline-none text-sm font-medium flex-1" />
        </div>
      </div>

      {tab === "radio" && (
        <div className="rounded-[2rem] brand-gradient p-8 md:p-12 text-white text-center glow-primary">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase mb-5">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> En direct
          </div>
          <Radio className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h2 className="font-display font-extrabold text-3xl">CHAY Radio</h2>
          <p className="text-white/80 mt-2">Louange & la Parole, 24h/24</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-foreground px-8 py-3.5 font-bold hover:scale-105 transition">
            <Play className="h-5 w-5" /> Écouter
          </button>
          <p className="text-white/60 text-xs mt-4">URL du flux en attente — connectez votre fournisseur pour diffuser.</p>
        </div>
      )}

      {tab === "music" && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {loading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse" />) :
           tracks.length ? tracks.map((t) => (
            <div key={t.id} className="group rounded-[1.5rem] border border-border bg-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="aspect-square rounded-2xl brand-gradient grid place-items-center mb-3 relative overflow-hidden">
                <Music className="h-8 w-8 text-white/90" />
                <button onClick={() => setPlaying(playing === t.id ? null : t.id)} className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/20 transition">
                  {playing === t.id ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition" />}
                </button>
              </div>
              <div className="font-bold text-sm line-clamp-1">{t.title}</div>
              <div className="text-xs text-foreground/55">{t.artist}</div>
              {t.audio_url && playing === t.id && <audio src={t.audio_url} autoPlay controls className="w-full mt-2 h-8" />}
            </div>
          )) : <p className="col-span-full text-foreground/50">Aucune musique importée pour le moment.</p>}
        </div>
      )}

      {tab === "sermons" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-[1.5rem] bg-card animate-pulse" />) :
           sermons.length ? sermons.map((s) => (
            <div key={s.id} className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="h-36 brand-gradient relative grid place-items-center">
                <Headphones className="h-10 w-10 text-white/90" />
                {s.audio_url && <span className="absolute bottom-3 right-3 rounded-full bg-black/40 backdrop-blur px-2.5 py-1 text-xs font-bold text-white">audio</span>}
              </div>
              <div className="p-5">
                <div className="font-display font-bold text-lg leading-snug line-clamp-2">{s.title}</div>
                <div className="mt-1 text-sm text-foreground/55 font-medium">{s.speaker} · {s.category || "Prédication"}</div>
                {s.audio_url ? <audio src={s.audio_url} controls className="w-full mt-3 h-9" /> : (
                  <div className="mt-3 h-9 rounded-full bg-muted grid place-items-center text-xs font-semibold text-foreground/40">Aucun fichier audio</div>
                )}
              </div>
            </div>
          )) : <p className="col-span-full text-foreground/50">Aucune prédication importée pour le moment.</p>}
        </div>
      )}

      {tab === "videos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-[1.5rem] bg-card animate-pulse" />) :
           videos.length ? videos.map((v) => (
            <div key={v.id} className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
              {v.video_url ? (
                <video src={v.video_url} controls className="w-full h-44 bg-black object-cover" poster={v.cover_url} />
              ) : (
                <div className="h-44 brand-gradient grid place-items-center"><Film className="h-12 w-12 text-white/90" /></div>
              )}
              <div className="p-5">
                <div className="font-display font-bold text-lg line-clamp-2">{v.title}</div>
                {v.description && <div className="text-sm text-foreground/55 mt-1 line-clamp-2">{v.description}</div>}
              </div>
            </div>
          )) : (
            <p className="col-span-full text-foreground/50">Aucune vidéo importée pour le moment. {isAdmin && "Touchez « Importer » pour ajouter vos vidéos."}</p>
          )}
        </div>
      )}

      {showUploader && <MediaUploader onClose={() => setShowUploader(false)} onSaved={loadAll} />}
    </div>
  );
}