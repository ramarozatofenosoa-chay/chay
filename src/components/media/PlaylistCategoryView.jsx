import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Film,
  Play,
  Pause,
  Star,
  Lock,
  Unlock,
  GripVertical,
  Pencil,
} from "lucide-react";
import VideoPlayer from "@/components/player/VideoPlayer";
import CreatePlaylistModal from "@/components/media/CreatePlaylistModal";
import PlaylistCover from "@/components/media/PlaylistCover";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(null);
  const [targetUnavailable, setTargetUnavailable] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState(null);
  const [playlistsLocked, setPlaylistsLocked] = useState(true);
  const [tracksLocked, setTracksLocked] = useState(true);
  const [localCats, setLocalCats] = useState(null);
  const [localTracks, setLocalTracks] = useState(null);
  const trackNodes = useRef(new Map());
  const targetTrackId = searchParams.get("track");
  const targetPlaylistId = searchParams.get("playlist");
  // Création de playlist directement depuis la Médiathèque (admin).
  const [showCreate, setShowCreate] = useState(false);

  const isVideo = kind === "video";

  const handleReorderCats = useCallback(async (next) => {
    setLocalCats(next);
    // Ne plus avaler l'erreur : Base44 rejette silencieusement un champ absent
    // de l'entité déployée, et l'ordre réapparaissait à sa place au rechargement.
    const results = await Promise.all(
      next.map((p, i) =>
        base44.entities.Playlist.update(p.id, { order: i }).then(
          () => true,
          () => false
        )
      )
    );
    if (results.includes(false)) {
      setLocalCats(null);
      toast({
        title: "Réorganisation non enregistrée",
        description:
          "Le champ « order » semble absent de l'entité Playlist côté Base44. Ajoutez-le (type nombre) dans Entities → Playlist, puis Publish.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleReorderTracks = useCallback(async (next) => {
    setLocalTracks(next);
    const results = await Promise.all(
      next.map((t, i) =>
        base44.entities.PlaylistTrack.update(t.id, { order: i }).then(
          () => true,
          () => false
        )
      )
    );
    if (results.includes(false)) {
      setLocalTracks(null);
      toast({
        title: "Réorganisation non enregistrée",
        description: "Vérifiez le champ « order » de l'entité PlaylistTrack.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const cats = (localCats ?? playlists
    .filter((p) => (p.category || "music") === category)
    .sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999)));
  const tracks = open
    ? (localTracks ?? playlistTracks
        .filter((t) => t.playlist_id === open.id)
        .sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999)))
    : [];

  useEffect(() => {
    if (!targetTrackId) {
      setTargetUnavailable(false);
      return;
    }

    const target = playlistTracks.find(
      (track) =>
        track.track_id === targetTrackId &&
        (!targetPlaylistId || track.playlist_id === targetPlaylistId)
    );
    const targetPlaylistIdForTrack = targetPlaylistId || target?.playlist_id;
    const targetPlaylist = playlists.find(
      (playlist) => playlist.id === targetPlaylistIdForTrack
    );

    const mediaUrl = category === "films" ? target?.video_url : target?.audio_url;
    if (
      !target ||
      !targetPlaylist ||
      target.playlist_id !== targetPlaylist.id ||
      (targetPlaylist.category || "music") !== category ||
      !mediaUrl
    ) {
      setOpen(null);
      setTargetUnavailable(true);
      return;
    }

    setTargetUnavailable(false);
    setLocalTracks(null);
    setOpen(targetPlaylist);
  }, [category, targetTrackId, targetPlaylistId, playlistTracks, playlists]);

  useEffect(() => {
    if (!targetTrackId || !open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      trackNodes.current.get(targetTrackId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [targetTrackId, open, tracks]);

  const closePlaylist = () => {
    setOpen(null);
    setLocalTracks(null);
    if (targetTrackId || targetPlaylistId) {
      const next = new URLSearchParams(searchParams);
      next.delete("track");
      next.delete("playlist");
      setSearchParams(next, { replace: true });
    }
  };

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
            onClick={closePlaylist}
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
                <div
                  key={t.id}
                  ref={(node) => {
                    if (node) trackNodes.current.set(t.track_id, node);
                    else trackNodes.current.delete(t.track_id);
                  }}
                  data-track-id={t.track_id}
                  className={`rounded-2xl border border-border bg-card overflow-hidden ${
                    targetTrackId === t.track_id ? "ring-2 ring-primary" : ""
                  }`}
                >
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
                  ref={(node) => {
                    if (node) trackNodes.current.set(t.track_id, node);
                    else trackNodes.current.delete(t.track_id);
                  }}
                  data-track-id={t.track_id}
                  className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-transform duration-150 select-none ${
                    targetTrackId === t.track_id ? "ring-2 ring-primary" : ""
                  }`}
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
          </>
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
      {targetUnavailable && (
        <p role="status" className="mb-4 text-sm text-foreground/60">
          Ce contenu n'est plus disponible dans cette playlist.
        </p>
      )}
      <div className="flex items-center justify-between mb-5 gap-3">
        <p className="text-sm text-foreground/55">Les contenus sont organisés en playlists.</p>
        {isAdmin && (
          <button
            onClick={() => {
              setPlaylistToEdit(null);
              setShowCreate(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold hover:scale-105 transition shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Créer une playlist
          </button>
        )}
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
                  <PlaylistCover playlist={p} className="h-12 w-12 shrink-0 rounded-xl" />
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
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setPlaylistToEdit(p);
                        setShowCreate(true);
                      }}
                      className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted"
                      aria-label={`Modifier la playlist ${p.name}`}
                      title="Modifier la playlist"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
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
                <div key={p.id} className="relative">
                  <button
                    onClick={() => { setLocalTracks(null); setOpen(p); }}
                    className="group w-full rounded-[1.5rem] border border-border bg-card p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    <PlaylistCover
                      playlist={p}
                      className="aspect-square rounded-2xl mb-3"
                    />
                    <div className="font-bold text-sm line-clamp-1">{p.name}</div>
                    <div className="text-xs text-foreground/55">{count} titre(s)</div>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setPlaylistToEdit(p);
                        setShowCreate(true);
                      }}
                      className="absolute right-6 top-6 h-9 w-9 grid place-items-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
                      aria-label={`Modifier la playlist ${p.name}`}
                      title="Modifier la playlist"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
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

      {/* Création de playlist depuis la Médiathèque : la photo choisie est
          uploadée puis enregistrée dans cover_url → la tuile affiche l'image. */}
      <CreatePlaylistModal
        open={showCreate}
        onOpenChange={(nextOpen) => {
          setShowCreate(nextOpen);
          if (!nextOpen) setPlaylistToEdit(null);
        }}
        category={category}
        playlist={playlistToEdit}
        onSaved={() => {
          setPlaylistToEdit(null);
          onSaved?.();
        }}
      />
    </div>
  );
}