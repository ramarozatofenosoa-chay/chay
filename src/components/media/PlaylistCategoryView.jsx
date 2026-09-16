import React, { useState } from "react";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Music,
  Film,
  Play,
  Pause,
  Headphones,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import AddPlaylistTrackModal from "@/components/media/AddPlaylistTrackModal";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

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
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const isVideo = kind === "video";
  const Icon = isVideo ? Film : category === "sermons" ? Headphones : Music;

  const cats = playlists.filter((p) => (p.category || "music") === category);
  const tracks = open ? playlistTracks.filter((t) => t.playlist_id === open.id) : [];

  const removeTrack = async (id) => {
    try {
      await base44.entities.PlaylistTrack.delete(id);
      onSaved?.();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

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
          {isAdmin && (
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          )}
        </div>

        {tracks.length ? (
          <div className="space-y-3">
            {tracks.map((t) =>
              isVideo ? (
                <div key={t.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  {t.video_url ? (
                    <video
                      src={t.video_url}
                      controls
                      controlsList="nodownload"
                      disablePictureInPicture
                      className="w-full max-h-72 bg-black"
                      poster={t.cover_url}
                    />
                  ) : (
                    <div className="h-40 brand-gradient grid place-items-center">
                      <Film className="h-10 w-10 text-white/90" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0 font-bold truncate">{t.title}</div>
                    {isAdmin && (
                      <button
                        onClick={() => removeTrack(t.id)}
                        className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <button
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
                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"
                  >
                    {currentTrack?.id === t.track_id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{t.title}</div>
                    {t.artist && <div className="text-xs text-foreground/55">{t.artist}</div>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => removeTrack(t.id)}
                      className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-foreground/50 text-sm">
            Aucun titre dans cette playlist pour le moment.
          </p>
        )}

        <AddPlaylistTrackModal
          open={addOpen}
          onOpenChange={setAddOpen}
          playlist={open}
          category={category}
          kind={kind}
          onSaved={onSaved}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-foreground/55">Les contenus sont organisés en playlists.</p>
        {isAdmin && onCreatePlaylist && (
          <button
            onClick={onCreatePlaylist}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold hover:scale-105 transition"
          >
            <Plus className="h-4 w-4" /> Créer une playlist
          </button>
        )}
      </div>

      {cats.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map((p) => {
            const count = playlistTracks.filter((pt) => pt.playlist_id === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => setOpen(p)}
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
      ) : (
        <p className="text-foreground/50 text-sm">
          Aucune playlist pour le moment
          {isAdmin ? ". Créez-en une pour ajouter des titres." : "."}
        </p>
      )}
    </div>
  );
}