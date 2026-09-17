import React, { useState } from "react";
import { Music, Headphones, Film, Play, Pause, Trash2 } from "lucide-react";

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
}) {
  const [tab, setTab] = useState("music");
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-foreground/60"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

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
    </div>
  );
}