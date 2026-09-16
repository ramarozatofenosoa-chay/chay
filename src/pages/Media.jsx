import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ContentAddModal from "@/components/media/ContentAddModal";
import CreatePlaylistModal from "@/components/media/CreatePlaylistModal";
import PlaylistPicker from "@/components/media/PlaylistPicker";
import PullToRefresh from "@/components/PullToRefresh";
import CategoryGrid from "@/components/media/CategoryGrid";
import MediaCategory from "@/components/media/MediaCategory";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { useRadio } from "@/lib/RadioContext";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Loader2 } from "lucide-react";

export default function Media() {
  const { toast } = useToast();
  const { currentTrack, isPlaying, play, playQueue, toggle } = useAudioPlayer();
  const radio = useRadio();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeCat = searchParams.get("cat");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [createCat, setCreateCat] = useState("music");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTrack, setPickerTrack] = useState(null);
  const [query, setQuery] = useState("");

  const [tracks, setTracks] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [articles, setArticles] = useState([]);
  const [youtube, setYoutube] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);

  const loadAll = async () => {
    const [t, s, v, a, y, g, p, pl, pt] = await Promise.all([
      base44.entities.MusicTrack.list("-created_date", 30).catch(() => []),
      base44.entities.Sermon.list("-date", 30).catch(() => []),
      base44.entities.Video.list("-created_date", 30).catch(() => []),
      base44.entities.Article.list("-created_date", 20).catch(() => []),
      base44.entities.YouTubeVideo.list("-created_date", 20).catch(() => []),
      base44.entities.GalleryImage.list("-created_date", 30).catch(() => []),
      base44.entities.PlaylistItem.list("-created_date", 50).catch(() => []),
      base44.entities.Playlist.list("-created_date", 50).catch(() => []),
      base44.entities.PlaylistTrack.list("-created_date", 200).catch(() => []),
    ]);
    setTracks(Array.isArray(t) ? t : []);
    setSermons(Array.isArray(s) ? s : []);
    setVideos(Array.isArray(v) ? v : []);
    setArticles(Array.isArray(a) ? a : []);
    setYoutube(Array.isArray(y) ? y : []);
    setGallery(Array.isArray(g) ? g : []);
    setPlaylist(Array.isArray(p) ? p : []);
    setPlaylists(Array.isArray(pl) ? pl : []);
    setPlaylistTracks(Array.isArray(pt) ? pt : []);
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

  const addToAdminPlaylist = (track) => {
    setPickerTrack(track);
    setPickerOpen(true);
  };

  const pickPlaylist = async (playlistId) => {
    if (!pickerTrack) return;
    try {
      await base44.entities.PlaylistTrack.create({
        playlist_id: playlistId,
        track_id: pickerTrack.id,
        title: pickerTrack.title,
        artist: pickerTrack.artist || null,
        audio_url: pickerTrack.audio_url || null,
        cover_url: pickerTrack.cover_url || null,
        kind: pickerTrack.kind || "audio",
      });
      toast({ title: "Ajouté à la playlist" });
      await loadAll();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setPickerOpen(false);
    setPickerTrack(null);
  };

  const removePlaylistTrack = async (id) => {
    await base44.entities.PlaylistTrack.delete(id).catch(() => {});
    setPlaylistTracks((p) => p.filter((i) => i.id !== id));
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
  const back = () => {
    if (window.history.length > 1) navigate(-1);
    else setSearchParams({});
  };

  return (
    <PullToRefresh mode="window" onRefresh={loadAll}>
    <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-12">
      <header className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-fluid">
            <span className="brand-gradient-text">Médiathèque</span>
          </h1>
          <p className="mt-3 text-base md:text-lg text-foreground/60">
            Musique, prédications, films, articles et plus encore.
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
          playQueue={playQueue}
          toggle={toggle}
          addToPlaylist={addToPlaylist}
          removeFromPlaylist={removeFromPlaylist}
          playPlaylistItem={playPlaylistItem}
          isPinned={isPinned}
          playlists={playlists}
          playlistTracks={playlistTracks}
          onAddToAdminPlaylist={addToAdminPlaylist}
          onCreatePlaylist={(cat) => { setCreateCat(cat || "music"); setShowCreatePlaylist(true); }}
          onSaved={loadAll}
          onRemovePlaylistTrack={removePlaylistTrack}
          isAdmin={isAdmin}
        />
      ) : (
        <CategoryGrid onOpen={openCat} radioPlaying={radio.isPlaying} onToggleRadio={() => radio.toggle()} />
      )}

      {showAdd && <ContentAddModal open={showAdd} onOpenChange={setShowAdd} onSaved={loadAll} />}
      {showCreatePlaylist && (
        <CreatePlaylistModal open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist} onSaved={loadAll} category={createCat} />
      )}
      <PlaylistPicker open={pickerOpen} onOpenChange={setPickerOpen} playlists={playlists} onPick={pickPlaylist} />
    </div>
    </PullToRefresh>
  );
}