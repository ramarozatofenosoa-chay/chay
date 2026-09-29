import React, { useState } from "react";
import { Music, Headphones, Film, Play, Pause, Trash2, Pencil } from "lucide-react";
import CreatePlaylistModal from "@/components/media/CreatePlaylistModal";
import PlaylistCover from "@/components/media/PlaylistCover";
import VideoPlayer from "@/components/player/VideoPlayer";

const TABS = [
  { id: "music", label: "Musique", icon: Music },
  { id: "sermons", label: "Prédication", icon: Headphones },
  { id: "films", label: "Film", icon: Film },
];

export default function FavoritesView({
  playlist = [],
  currentTrack,
  isPlaying,
  playPlaylistItem,
  removeFromPlaylist,
  playlists = [],
  onDeletePlaylist,
  onSaved,
  isAdmin,
}) {
  const [tab, setTab] = useState("music");
  const [playlistToEdit, setPlaylistToEdit] = useState(null);
  const items = playlist.filter((p) => (p.category || "music") === tab);

  return (
    <div>
      <div className="inline-flex rounded-full border border-border bg-card p-1 gap-1 mb-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-label={t.label}
              aria-pressed={tab === t.id}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold transition ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-foreground/60"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* Liste des playlists (admin) */}
      {isAdmin && playlists.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">
            Playlists
          </p>
          {playlists.map((pl) => (
            <div key={pl.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <PlaylistCover
                playlist={pl}
                className="h-10 w-10 rounded-xl shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{pl.name}</div>
              </div>
              <button
                onClick={() => setPlaylistToEdit(pl)}
                className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-foreground hover:bg-muted shrink-0"
                aria-label={`Modifier la playlist ${pl.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              {onDeletePlaylist && (
                <button
                  onClick={() => onDeletePlaylist(pl.id)}
                  className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted shrink-0"
                  aria-label="Supprimer la playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) =>
            item.kind === "video" ? (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
                    <Film className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{item.title}</div>
                    <div className="text-xs text-foreground/55">Film</div>
                  </div>
                  <button
                    onClick={() => removeFromPlaylist(item.id)}
                    className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {item.video_url && (
                  <VideoPlayer
                    src={item.video_url}
                    title={item.title}
                    poster={item.cover_url}
                    className="mt-3 w-full rounded-xl max-h-72"
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
                  {currentTrack?.id === item.track_id && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
          Rien ici pour l'instant. Touchez l'étoile sur un titre pour l'ajouter à votre playlist.
        </p>
      )}
      <CreatePlaylistModal
        open={Boolean(playlistToEdit)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPlaylistToEdit(null);
        }}
        playlist={playlistToEdit}
        category={playlistToEdit?.category || "music"}
        onSaved={() => {
          setPlaylistToEdit(null);
          onSaved?.();
        }}
      />
    </div>
  );
}
