import React from "react";
import {
  ChevronLeft,
  Search,
  Play,
  Pause,
  Headphones,
  Film,
  Music,
  Plus,
  Trash2,
  Radio,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import ArticleCard from "@/components/media/ArticleCard";
import YouTubeCard from "@/components/media/YouTubeCard";
import { RADIO_URL } from "@/lib/mediaConstants";

const TITLES = {
  radio: "Radio",
  music: "Musique",
  sermons: "Prédication",
  videos: "Vidéos",
  articles: "Articles",
  youtube: "YouTube",
  gallery: "Galerie",
  playlist: "Votre Playlist",
};

function SearchBar({ query, setQuery, placeholder }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 mb-5">
      <Search className="h-4 w-4 text-foreground/40" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Rechercher…"}
        className="bg-transparent outline-none text-sm font-medium flex-1"
      />
    </div>
  );
}

export default function MediaCategory({
  cat,
  data,
  query,
  setQuery,
  onBack,
  currentTrack,
  isPlaying,
  play,
  toggle,
  addToPlaylist,
  removeFromPlaylist,
  playPlaylistItem,
  isPinned,
}) {
  const { tracks, sermons, videos, articles, youtube, gallery, playlist } = data;
  const q = query.trim().toLowerCase();
  const match = (t) => (q ? (t || "").toLowerCase().includes(q) : true);
  const fTracks = tracks.filter((t) => match(t.title) || match(t.artist));
  const fSermons = sermons.filter((s) => match(s.title) || match(s.speaker));
  const fVideos = videos.filter((v) => match(v.title));
  const fArticles = articles.filter((a) => match(a.title) || match(a.category));
  const fYoutube = youtube.filter((y) => match(y.title) || match(y.category));
  const fGallery = gallery.filter((g) => match(g.title) || match(g.category));

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display font-extrabold text-2xl">{TITLES[cat]}</h2>
      </div>

      {cat === "radio" && (
        <div className="rounded-[2rem] brand-gradient p-8 md:p-12 text-white text-center glow-primary">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase mb-5">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> En direct
          </div>
          <Radio className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h3 className="font-display font-extrabold text-3xl">CHAY Radio</h3>
          <p className="text-white/80 mt-2">Louange & la Parole, 24h/24</p>
          <a
            href={RADIO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-foreground px-8 py-3.5 font-bold hover:scale-105 transition"
          >
            <Play className="h-5 w-5" /> Écouter
          </a>
        </div>
      )}

      {cat === "music" && (
        <>
          <SearchBar query={query} setQuery={setQuery} placeholder="Rechercher de la musique…" />
          {fTracks.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fTracks.map((t) => (
                <div
                  key={t.id}
                  className="group rounded-[1.5rem] border border-border bg-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square rounded-2xl brand-gradient grid place-items-center mb-3 relative overflow-hidden">
                    <Music className="h-8 w-8 text-white/90" />
                    <button
                      onClick={() => (currentTrack?.id === t.id ? toggle() : play(t))}
                      className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/20 transition"
                    >
                      {currentTrack?.id === t.id && isPlaying ? (
                        <Pause className="h-8 w-8 text-white" />
                      ) : (
                        <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        addToPlaylist({ id: t.id, title: t.title, artist: t.artist, audio_url: t.audio_url, cover_url: t.cover_url, kind: "audio" })
                      }
                      className={`absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full text-white text-lg font-bold ${
                        isPinned(t.id) ? "bg-primary" : "bg-black/30 opacity-0 group-hover:opacity-100 hover:bg-black/50"
                      }`}
                    >
                      ＋
                    </button>
                  </div>
                  <div className="font-bold text-sm line-clamp-1">{t.title}</div>
                  <div className="text-xs text-foreground/55">{t.artist}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucune musique importée.</p>
          )}
        </>
      )}

      {cat === "sermons" && (
        <>
          <SearchBar query={query} setQuery={setQuery} placeholder="Rechercher une prédication…" />
          {fSermons.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fSermons.map((s) => (
                <div
                  key={s.id}
                  className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  <div className="h-36 brand-gradient relative grid place-items-center">
                    <Headphones className="h-10 w-10 text-white/90" />
                    <button
                      onClick={() =>
                        addToPlaylist({ id: s.id, title: s.title, artist: s.speaker, audio_url: s.audio_url, cover_url: s.cover_url, kind: "audio" })
                      }
                      className={`absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full text-white ${
                        isPinned(s.id) ? "bg-primary" : "bg-black/30 opacity-0 group-hover:opacity-100 hover:bg-black/50"
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="font-display font-bold text-lg leading-snug line-clamp-2">{s.title}</div>
                    <div className="mt-1 text-sm text-foreground/55 font-medium">
                      {s.speaker} · {s.category || "Prédication"}
                    </div>
                    {s.audio_url ? (
                      <audio src={s.audio_url} controls controlsList="nodownload" className="w-full mt-3 h-9" />
                    ) : (
                      <div className="mt-3 h-9 rounded-full bg-muted grid place-items-center text-xs font-semibold text-foreground/40">
                        Aucun fichier audio
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucune prédication importée.</p>
          )}
        </>
      )}

      {cat === "videos" && (
        <>
          <SearchBar query={query} setQuery={setQuery} placeholder="Rechercher une vidéo…" />
          {fVideos.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fVideos.map((v) => (
                <div
                  key={v.id}
                  className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all relative"
                >
                  <button
                    onClick={() =>
                      addToPlaylist({ id: v.id, title: v.title, video_url: v.video_url, cover_url: v.cover_url, kind: "video" })
                    }
                    className={`absolute top-2 right-2 z-10 h-8 w-8 grid place-items-center rounded-full text-white ${
                      isPinned(v.id) ? "bg-primary" : "bg-black/40 opacity-0 group-hover:opacity-100 hover:bg-black/60"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {v.video_url ? (
                    <video
                      src={v.video_url}
                      controls
                      controlsList="nodownload"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-44 bg-black object-cover"
                      poster={v.cover_url}
                    />
                  ) : (
                    <div className="h-44 brand-gradient grid place-items-center">
                      <Film className="h-12 w-12 text-white/90" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="font-display font-bold text-lg line-clamp-2">{v.title}</div>
                    {v.description && (
                      <div className="text-sm text-foreground/55 mt-1 line-clamp-2">{v.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucune vidéo importée.</p>
          )}
        </>
      )}

      {cat === "articles" && (
        <>
          <SearchBar query={query} setQuery={setQuery} placeholder="Rechercher un article…" />
          {fArticles.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fArticles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucun article publié.</p>
          )}
        </>
      )}

      {cat === "youtube" && (
        <>
          <SearchBar query={query} setQuery={setQuery} placeholder="Rechercher sur YouTube…" />
          {fYoutube.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fYoutube.map((y) => (
                <YouTubeCard key={y.id} video={y} />
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucune vidéo YouTube ajoutée.</p>
          )}
        </>
      )}

      {cat === "gallery" && (
        <>
          {fGallery.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fGallery.map((g) => (
                <figure key={g.id} className="rounded-2xl overflow-hidden border border-border bg-card group">
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={g.image_url}
                      fittingType="fill"
                      className="w-full h-full group-hover:scale-105 transition"
                    />
                  </div>
                  {g.title && (
                    <figcaption className="p-2.5 text-xs font-semibold text-foreground/60 truncate">
                      {g.title}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucune image dans la galerie.</p>
          )}
        </>
      )}

      {cat === "playlist" && (
        <>
          <p className="text-sm text-foreground/55 mb-4">
            Ajoutez musique, prédications et vidéos depuis leurs catégories — votre playlist personnelle.
          </p>
          {playlist.length ? (
            <div className="space-y-3">
              {playlist.map((item) =>
                item.kind === "video" ? (
                  <div key={item.id} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
                        <Film className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{item.title}</div>
                        <div className="text-xs text-foreground/55">Vidéo</div>
                      </div>
                      <button
                        onClick={() => removeFromPlaylist(item.id)}
                        className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.video_url && (
                      <video
                        src={item.video_url}
                        controls
                        controlsList="nodownload"
                        disablePictureInPicture
                        className="w-full mt-3 rounded-xl max-h-72 bg-black"
                        poster={item.cover_url}
                      />
                    )}
                  </div>
                ) : (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <div className="h-12 w-12 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
                      <Music className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{item.title}</div>
                      <div className="text-xs text-foreground/55">{item.artist || "Audio"}</div>
                    </div>
                    <button
                      onClick={() => playPlaylistItem(item)}
                      className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center"
                    >
                      {currentTrack?.id === item.track_id && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => removeFromPlaylist(item.id)}
                      className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">
              Votre playlist est vide. Ajoutez des titres depuis Musique, Prédication ou Vidéos.
            </p>
          )}
        </>
      )}
    </div>
  );
}