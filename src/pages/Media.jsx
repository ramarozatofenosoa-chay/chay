import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import MediaUploader from "@/components/MediaUploader";
import ContentAddModal from "@/components/media/ContentAddModal";
import MediaSection from "@/components/media/MediaSection";
import ArticleCard from "@/components/media/ArticleCard";
import YouTubeCard from "@/components/media/YouTubeCard";
import PlaylistSection from "@/components/media/PlaylistSection";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import {
  Play,
  Pause,
  Headphones,
  Radio,
  Film,
  Music,
  Search,
  Upload,
  Plus,
  FileText,
  Youtube,
  Image as ImageIcon,
  ListMusic,
  Loader2,
} from "lucide-react";

export default function Media() {
  const { toast } = useToast();
  const { currentTrack, isPlaying, play, toggle } = useAudioPlayer();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");

  const [tracks, setTracks] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [articles, setArticles] = useState([]);
  const [youtube, setYoutube] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [playlist, setPlaylist] = useState([]);

  const loadAll = async () => {
    const [t, s, v, a, y, g, p] = await Promise.all([
      base44.entities.MusicTrack.list("-created_date", 30).catch(() => []),
      base44.entities.Sermon.list("-date", 30).catch(() => []),
      base44.entities.Video.list("-created_date", 30).catch(() => []),
      base44.entities.Article.list("-created_date", 20).catch(() => []),
      base44.entities.YouTubeVideo.list("-created_date", 20).catch(() => []),
      base44.entities.GalleryImage.list("-created_date", 30).catch(() => []),
      base44.entities.PlaylistItem.list("-created_date", 50).catch(() => []),
    ]);
    setTracks(Array.isArray(t) ? t : []);
    setSermons(Array.isArray(s) ? s : []);
    setVideos(Array.isArray(v) ? v : []);
    setArticles(Array.isArray(a) ? a : []);
    setYoutube(Array.isArray(y) ? y : []);
    setGallery(Array.isArray(g) ? g : []);
    setPlaylist(Array.isArray(p) ? p : []);
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

  const q = query.trim().toLowerCase();
  const match = (text) => (q ? (text || "").toLowerCase().includes(q) : true);
  const fTracks = tracks.filter((t) => match(t.title) || match(t.artist));
  const fSermons = sermons.filter((s) => match(s.title) || match(s.speaker));
  const fVideos = videos.filter((v) => match(v.title));
  const fArticles = articles.filter((a) => match(a.title) || match(a.category));
  const fYoutube = youtube.filter((y) => match(y.title) || match(y.category));
  const fGallery = gallery.filter((g) => match(g.title) || match(g.category));

  const addToPlaylist = async (track) => {
    try {
      if (playlist.some((p) => p.track_id === track.id)) {
        toast({ title: "Déjà dans votre playlist" });
        return;
      }
      await base44.entities.PlaylistItem.create({
        track_id: track.id,
        title: track.title,
        artist: track.artist,
        audio_url: track.audio_url,
        cover_url: track.cover_url,
      });
      toast({ title: "Ajouté à votre playlist" });
      await loadAll();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const removeFromPlaylist = async (id) => {
    await base44.entities.PlaylistItem.delete(id).catch(() => {});
    setPlaylist((p) => p.filter((i) => i.id !== id));
  };

  const playPlaylistItem = (item) => {
    if (currentTrack?.id === item.track_id) {
      toggle();
      return;
    }
    play({
      id: item.track_id,
      title: item.title,
      artist: item.artist,
      audio_url: item.audio_url,
      cover_url: item.cover_url,
    });
  };

  const isPinned = (trackId) => playlist.some((p) => p.track_id === trackId);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-12">
      <header className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-fluid">
            <span className="brand-gradient-text">Médiathèque</span>
          </h1>
          <p className="mt-3 text-base md:text-lg text-foreground/60">
            Musique, prédications, vidéos, articles et plus encore.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold hover:bg-muted transition"
            >
              <FileText className="h-4 w-4" /> Contenu
            </button>
            <button
              onClick={() => setShowUploader(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-bold glow-primary hover:scale-105 transition"
            >
              <Upload className="h-4 w-4" /> Importer
            </button>
          </div>
        )}
      </header>

      {/* Search */}
      <div className="mb-8 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3">
        <Search className="h-4 w-4 text-foreground/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans la médiathèque…"
          className="bg-transparent outline-none text-sm font-medium flex-1"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Radio */}
          <MediaSection icon={Radio} title="Radio en direct">
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
            </div>
          </MediaSection>

          {/* Musique */}
          <MediaSection icon={Music} title="Musique">
            {fTracks.length ? (
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {fTracks.map((t) => (
                  <div
                    key={t.id}
                    className="group rounded-[1.5rem] border border-border bg-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all w-40 shrink-0"
                  >
                    <div className="aspect-square rounded-2xl brand-gradient grid place-items-center mb-3 relative overflow-hidden">
                      <Music className="h-8 w-8 text-white/90" />
                      <button
                        onClick={() =>
                          currentTrack?.id === t.id ? toggle() : play(t)
                        }
                        className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/20 transition"
                      >
                        {currentTrack?.id === t.id && isPlaying ? (
                          <Pause className="h-8 w-8 text-white" />
                        ) : (
                          <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition" />
                        )}
                      </button>
                      <button
                        onClick={() => addToPlaylist(t)}
                        className={`absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full text-white text-lg font-bold transition ${
                          isPinned(t.id) ? "bg-primary" : "bg-black/30 opacity-0 group-hover:opacity-100 hover:bg-black/50"
                        }`}
                        aria-label="Ajouter à ma playlist"
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
              <p className="text-foreground/50 text-sm">Aucune musique importée pour le moment.</p>
            )}
          </MediaSection>

          {/* Votre playlist */}
          <MediaSection icon={ListMusic} title="Votre playlist">
            <PlaylistSection
              items={playlist}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              onPlay={playPlaylistItem}
              onRemove={removeFromPlaylist}
            />
          </MediaSection>

          {/* Prédications */}
          <MediaSection icon={Headphones} title="Prédications">
            {fSermons.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {fSermons.map((s) => (
                  <div
                    key={s.id}
                    className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    <div className="h-36 brand-gradient relative grid place-items-center">
                      <Headphones className="h-10 w-10 text-white/90" />
                    </div>
                    <div className="p-5">
                      <div className="font-display font-bold text-lg leading-snug line-clamp-2">
                        {s.title}
                      </div>
                      <div className="mt-1 text-sm text-foreground/55 font-medium">
                        {s.speaker} · {s.category || "Prédication"}
                      </div>
                      {s.audio_url ? (
                        <audio
                          src={s.audio_url}
                          controls
                          controlsList="nodownload"
                          className="w-full mt-3 h-9"
                        />
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
              <p className="text-foreground/50 text-sm">Aucune prédication importée pour le moment.</p>
            )}
          </MediaSection>

          {/* Vidéos */}
          <MediaSection icon={Film} title="Vidéos">
            {fVideos.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {fVideos.map((v) => (
                  <div
                    key={v.id}
                    className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
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
                        <div className="text-sm text-foreground/55 mt-1 line-clamp-2">
                          {v.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-sm">Aucune vidéo importée pour le moment.</p>
            )}
          </MediaSection>

          {/* Articles */}
          <MediaSection icon={FileText} title="Articles">
            {fArticles.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {fArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-sm">Aucun article publié pour le moment.</p>
            )}
          </MediaSection>

          {/* YouTube */}
          <MediaSection icon={Youtube} title="YouTube">
            {fYoutube.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {fYoutube.map((y) => (
                  <YouTubeCard key={y.id} video={y} />
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-sm">Aucune vidéo YouTube ajoutée pour le moment.</p>
            )}
          </MediaSection>

          {/* Galerie */}
          <MediaSection icon={ImageIcon} title="Galerie">
            {fGallery.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {fGallery.map((g) => (
                  <figure
                    key={g.id}
                    className="rounded-2xl overflow-hidden border border-border bg-card group"
                  >
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
              <p className="text-foreground/50 text-sm">Aucune image dans la galerie pour le moment.</p>
            )}
          </MediaSection>
        </>
      )}

      {showUploader && <MediaUploader onClose={() => setShowUploader(false)} onSaved={loadAll} />}
      {showAdd && <ContentAddModal open={showAdd} onOpenChange={setShowAdd} onSaved={loadAll} />}
    </div>
  );
}