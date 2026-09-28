import React, { useState, useRef, useCallback } from "react";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Music,
  Film,
  Play,
  Pause,
  Headphones,
  Star,
  Lock,
  Unlock,
  GripVertical,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import VideoPlayer from "@/components/player/VideoPlayer";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

/* ── Hook drag & drop tactile + souris ── */
function useDragSort(items, onReorder) {
  const dragIdx = useRef(null);
  const listRef = useRef(null);

  const getItemEls = () =>
    listRef.current ? Array.from(listRef.current.children) : [];

  const indexFromY = (clientY) => {
    const els = getItemEls();
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return els.length - 1;
  };

  const onMouseDown = useCallback((idx) => (e) => {
    e.preventDefault();
    dragIdx.current = idx;
    const els = getItemEls();
    els[idx]?.classList.add("opacity-50", "scale-[0.98]");
    const onMove = (me) => {
      const target = indexFromY(me.clientY);
      els.forEach((el, i) => {
        el.style.transform = "";
        if (i === dragIdx.current) return;
        if (dragIdx.current < target ? i > dragIdx.current && i <= target : i < dragIdx.current && i >= target)
          el.style.transform = dragIdx.current < target ? "translateY(-60px)" : "translateY(60px)";
      });
    };
    const onUp = (me) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const from = dragIdx.current;
      dragIdx.current = null;
      els.forEach((el) => { el.classList.remove("opacity-50", "scale-[0.98]"); el.style.transform = ""; });
      const to = indexFromY(me.clientY);
      if (from !== to) { const next = [...items]; const [m] = next.splice(from, 1); next.splice(to, 0, m); onReorder(next); }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [items, onReorder]);

  const onTouchStart = useCallback((idx) => (e) => {
    dragIdx.current = idx;
    const els = getItemEls();
    els[idx]?.classList.add("opacity-50", "scale-[0.98]");
    const onMove = (te) => {
      te.preventDefault();
      const touch = te.touches[0];
      const target = indexFromY(touch.clientY);
      els.forEach((el, i) => {
        el.style.transform = "";
        if (i === dragIdx.current) return;
        if (dragIdx.current < target ? i > dragIdx.current && i <= target : i < dragIdx.current && i >= target)
          el.style.transform = dragIdx.current < target ? "translateY(-60px)" : "translateY(60px)";
      });
    };
    const onEnd = (te) => {
      listRef.current?.removeEventListener("touchmove", onMove);
      listRef.current?.removeEventListener("touchend", onEnd);
      const from = dragIdx.current;
      dragIdx.current = null;
      els.forEach((el) => { el.classList.remove("opacity-50", "scale-[0.98]"); el.style.transform = ""; });
      const touch = te.changedTouches[0];
      const to = indexFromY(touch.clientY);
      if (from !== to) { const next = [...items]; const [m] = next.splice(from, 1); next.splice(to, 0, m); onReorder(next); }
    };
    listRef.current?.addEventListener("touchmove", onMove, { passive: false });
    listRef.current?.addEventListener("touchend", onEnd);
  }, [items, onReorder]);

  return { listRef, onMouseDown, onTouchStart };
}

function LockToggle({ locked, onToggle }) {
  return (
    <button onClick={onToggle} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition ${locked ? "border-border bg-card text-muted-foreground hover:bg-muted" : "border-primary bg-primary/10 text-primary hover:bg-primary/20"}`}>
      {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
      {locked ? "Verrouillé" : "Réorganiser"}
    </button>
  );
}

export default function PlaylistCategoryView({
  category,
  kind = "audio",
  playlists = [],
  playlistTracks = [],
  currentTrack,
  isPlaying,
  playQueue,
  toggle,
  isAdmin,
  onCreatePlaylist,
  onSaved,
  onToggleFavorite,
  isFavorite,
  favoriteCategory,
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(null);
  const [playlistsLocked, setPlaylistsLocked] = useState(true);
  const [tracksLocked, setTracksLocked] = useState(true);
  const [localCats, setLocalCats] = useState(null);
  const [localTracks, setLocalTracks] = useState(null);

  const isVideo = kind === "video";
  const Icon = isVideo ? Film : category === "sermons" ? Headphones : Music;

  const handleReorderCats = useCallback(async (next) => {
    setLocalCats(next);
    await Promise.all(next.map((p, i) => base44.entities.Playlist.update(p.id, { order: i }).catch(() => {})));
  }, []);

  const handleReorderTracks = useCallback(async (next) => {
    setLocalTracks(next);
    await Promise.all(next.map((t, i) => base44.entities.PlaylistTrack.update(t.id, { order: i }).catch(() => {})));
  }, []);

  const cats = (localCats ?? playlists
    .filter((p) => (p.category || "music") === category)
    .sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999)));
  const tracks = open
    ? (localTracks ?? playlistTracks
        .filter((t) => t.playlist_id === open.id)
        .sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999)))
    : [];

  const catDrag = useDragSort(cats, handleReorderCats);
  const trackDrag = useDragSort(tracks, handleReorderTracks);


  const favItem = (t) => ({
    id: t.track_id,
    title: t.title,
    artist: t.artist,
    audio_url: t.audio_url,
    video_url: t.video_url,
    cover_url: t.cover_url,
    kind: t.kind,
  });

  if (open) {
    const audioTracks = tracks.filter((t) => !isVideo && t.audio_url);
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setOpen(null)}
            className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display font-extrabold text-2xl truncate flex-1">
            {open.name}
          </h2>
        </div>

        {tracks.length ? (
          <>
            {isAdmin && tracks.length > 1 && (
              <div className="flex justify-end mb-2">
                <LockToggle locked={tracksLocked} onToggle={() => setTracksLocked((v) => !v)} />
              </div>
            )}
          <div ref={trackDrag.listRef} className="space-y-3">
            {tracks.map((t, idx) =>
              isVideo ? (
                <div key={t.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  {t.video_url ? (
                    <VideoPlayer
                      src={t.video_url}
                      poster={t.cover_url}
                      className="w-full max-h-72"
                    />
                  ) : (
                    <div className="h-40 brand-gradient grid place-items-center">
                      <Film className="h-10 w-10 text-white/90" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0 font-bold truncate">{t.title}</div>
                    <button
                      onClick={() => onToggleFavorite?.(favItem(t), favoriteCategory)}
                      className={`h-9 w-9 grid place-items-center rounded-full hover:bg-muted ${isFavorite?.(t.track_id) ? "text-primary" : "text-foreground/40 hover:text-primary"}`}
                      title="Ajouter à ma playlist"
                    >
                      <Star className="h-4 w-4" fill={isFavorite?.(t.track_id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-transform duration-150 select-none"
                >
                  {isAdmin && !tracksLocked && (
                    <div
                      className="cursor-grab active:cursor-grabbing touch-none shrink-0 text-muted-foreground"
                      onMouseDown={trackDrag.onMouseDown(idx)}
                      onTouchStart={trackDrag.onTouchStart(idx)}
                    >
                      <GripVertical className="h-5 w-5" />
                    </div>
                  )}
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      const i = audioTracks.findIndex((a) => a.id === t.id);
                      if (currentTrack?.id === t.track_id) toggle();
                      else if (i >= 0)
                        playQueue(
                          audioTracks.map((a) => ({
                            id: a.track_id,
                            title: a.title,
                            artist: a.artist,
                            audio_url: a.audio_url,
                            cover_url: a.cover_url,
                          })),
                          i
                        );
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
                      {currentTrack?.id === t.track_id && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{t.title}</div>
                      {t.artist && <div className="text-xs text-foreground/55">{t.artist}</div>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(favItem(t), favoriteCategory); }}
                    className={`h-9 w-9 grid place-items-center rounded-full hover:bg-muted ${isFavorite?.(t.track_id) ? "text-primary" : "text-foreground/40 hover:text-primary"}`}
                    title="Ajouter à ma playlist"
                  >
                    <Star className="h-4 w-4" fill={isFavorite?.(t.track_id) ? "currentColor" : "none"} />
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-foreground/50 text-sm">
            Aucun titre dans cette playlist pour le moment.
          </p>
        )}

      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-foreground/55">Les contenus sont organisés en playlists.</p>
        {isAdmin && cats.length > 1 && (
          <LockToggle locked={playlistsLocked} onToggle={() => setPlaylistsLocked((v) => !v)} />
        )}
      </div>

      {cats.length ? (
        !playlistsLocked && isAdmin ? (
          /* Mode réorganisation : liste verticale avec poignées */
          <div ref={catDrag.listRef} className="space-y-2">
            {cats.map((p, idx) => {
              const count = playlistTracks.filter((pt) => pt.playlist_id === p.id).length;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-transform duration-150 select-none"
                >
                  <div
                    className="cursor-grab active:cursor-grabbing touch-none shrink-0 text-muted-foreground"
                    onMouseDown={catDrag.onMouseDown(idx)}
                    onTouchStart={catDrag.onTouchStart(idx)}
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden grid place-items-center brand-gradient">
                    {p.cover_url ? (
                      <Image src={p.cover_url} fittingType="fill" className="w-full h-full" />
                    ) : (
                      <Icon className="h-6 w-6 text-white/90" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-foreground/55">{count} titre(s)</div>
                  </div>
                  <button
                    onClick={() => setOpen(p)}
                    className="text-xs font-bold text-primary px-3 py-1 rounded-full border border-primary/30 hover:bg-primary/10"
                  >
                    Ouvrir
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Mode normal : grille */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cats.map((p) => {
              const count = playlistTracks.filter((pt) => pt.playlist_id === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => { setLocalTracks(null); setOpen(p); }}
                  className="group rounded-[1.5rem] border border-border bg-card p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  {p.cover_url ? (
                    <div className="aspect-square rounded-2xl overflow-hidden mb-3">
                      <Image src={p.cover_url} fittingType="fill" className="w-full h-full" />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-2xl mb-3 grid place-items-center brand-gradient">
                      <Icon className="h-8 w-8 text-white/90" />
                    </div>
                  )}
                  <div className="font-bold text-sm line-clamp-1">{p.name}</div>
                  <div className="text-xs text-foreground/55">{count} titre(s)</div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <p className="text-foreground/50 text-sm">
          Aucune playlist pour le moment
          {isAdmin ? ". Créez-en une pour ajouter des titres." : "."}
        </p>
      )}
    </div>
  );
}