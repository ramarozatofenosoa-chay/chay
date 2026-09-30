import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, Film, Play, Pause, Star } from "lucide-react";
import VideoPlayer from "@/components/player/VideoPlayer";
import PlaylistCover from "@/components/media/PlaylistCover";

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
  onToggleFavorite,
  isFavorite,
  favoriteCategory,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(null);
  const [targetUnavailable, setTargetUnavailable] = useState(false);
  const trackNodes = useRef(new Map());
  const targetTrackId = searchParams.get("track");
  const targetPlaylistId = searchParams.get("playlist");

  const isVideo = kind === "video";

  const cats = playlists
    .filter((p) => (p.category || "music") === category)
    .sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999));
  const tracks = open
    ? playlistTracks
        .filter((t) => t.playlist_id === open.id)
        .sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999))
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
    if (targetTrackId || targetPlaylistId) {
      const next = new URLSearchParams(searchParams);
      next.delete("track");
      next.delete("playlist");
      setSearchParams(next, { replace: true });
    }
  };

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
    const videoQueue = tracks
      .filter((track) => track.video_url)
      .map((track) => ({
        id: track.id,
        src: track.video_url,
        title: track.title,
        poster: track.cover_url,
      }));
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
          <div className="space-y-3">
            {tracks.map((t) =>
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
                      title={t.title}
                      queue={videoQueue}
                      currentIndex={videoQueue.findIndex((item) => item.id === t.id)}
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
                            mediaType: category === "sermons" ? "sermons" : "music",
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
      {targetUnavailable && (
        <p role="status" className="mb-4 text-sm text-foreground/60">
          Ce contenu n'est plus disponible dans cette playlist.
        </p>
      )}
      <div className="flex items-center justify-between mb-5 gap-3">
        <p className="text-sm text-foreground/55">Les contenus sont organisés en playlists.</p>
      </div>

      {cats.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map((p) => {
            const count = playlistTracks.filter((pt) => pt.playlist_id === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => setOpen(p)}
                className="group w-full rounded-[1.5rem] border border-border bg-card p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                <PlaylistCover
                  playlist={p}
                  className="aspect-square rounded-2xl mb-3"
                />
                <div className="font-bold text-sm line-clamp-1">{p.name}</div>
                <div className="text-xs text-foreground/55">{count} titre(s)</div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-foreground/50 text-sm">
          Aucune playlist pour le moment
          {isAdmin
            ? ". Créez-en une depuis le panneau d'administration."
            : "."}
        </p>
      )}

    </div>
  );
}