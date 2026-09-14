import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MediaUploader from "@/components/MediaUploader";
import ContentAddModal from "@/components/media/ContentAddModal";
import CategoryGrid from "@/components/media/CategoryGrid";
import MediaCategory from "@/components/media/MediaCategory";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";

export default function Media() {
  const { toast } = useToast();
  const { currentTrack, isPlaying, play, toggle } = useAudioPlayer();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCat = searchParams.get("cat");
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

  const addToPlaylist = async (item) => {
    try {
      if (playlist.some((p) => p.track_id === item.id)) {
        toast({ title: "Déjà dans votre playlist" });
        return;
      }
      await base44.entities.PlaylistItem.create({
        track_id: item.id,
        title: item.title,
        artist: item.artist || null,
        audio_url: item.audio_url || null,
        video_url: item.video_url || null,
        cover_url: item.cover_url || null,
        kind: item.kind || "audio",
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

  const isPinned = (id) => playlist.some((p) => p.track_id === id);

  const openCat = (id) => setSearchParams({ cat: id });
  const back = () => setSearchParams({}, { replace: true });

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

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activeCat ? (
        <MediaCategory
          cat={activeCat}
          data={{ tracks, sermons, videos, articles, youtube, gallery, playlist }}
          query={query}
          setQuery={setQuery}
          onBack={back}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          play={play}
          toggle={toggle}
          addToPlaylist={addToPlaylist}
          removeFromPlaylist={removeFromPlaylist}
          playPlaylistItem={playPlaylistItem}
          isPinned={isPinned}
        />
      ) : (
        <CategoryGrid onOpen={openCat} />
      )}

      {showUploader && <MediaUploader onClose={() => setShowUploader(false)} onSaved={loadAll} />}
      {showAdd && <ContentAddModal open={showAdd} onOpenChange={setShowAdd} onSaved={loadAll} />}
    </div>
  );
}