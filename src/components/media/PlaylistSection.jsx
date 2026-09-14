import React, { useState } from "react";
import { Play, Pause, Trash2 } from "lucide-react";

export default function PlaylistSection({ items, currentTrackId, isPlaying, onPlay, onRemove }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-foreground/50 text-sm">
          Votre playlist est vide. Ajoutez des titres depuis la section Musique
          avec le bouton <span className="font-bold text-primary">＋</span>.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const active = currentTrackId === it.track_id;
        return (
          <div
            key={it.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5"
          >
            <button
              onClick={() => onPlay(it)}
              className="h-11 w-11 rounded-xl brand-gradient grid place-items-center text-white shrink-0"
            >
              {active && isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{it.title}</div>
              <div className="text-xs text-foreground/55 truncate">{it.artist}</div>
            </div>
            <button
              onClick={() => onRemove(it.id)}
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-destructive/10 text-foreground/50 hover:text-destructive transition shrink-0"
              aria-label="Retirer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}