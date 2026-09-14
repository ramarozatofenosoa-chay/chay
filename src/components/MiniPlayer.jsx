import React from "react";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { Play, Pause, X, Music, SkipBack, SkipForward, Shuffle, Repeat } from "lucide-react";

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    toggle,
    stop,
    next,
    prev,
    shuffle,
    loop,
    toggleShuffle,
    toggleLoop,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-24 md:bottom-6 inset-x-0 z-50 px-4 pointer-events-none">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-lg flex items-center gap-1.5 px-3 py-2.5 pointer-events-auto">
        <div className="h-10 w-10 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
          <Music className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 mx-1">
          <div className="font-bold text-sm truncate">{currentTrack.title}</div>
          <div className="text-xs text-foreground/55 truncate">
            {currentTrack.artist || currentTrack.speaker || "Chay"}
          </div>
        </div>
        <button
          onClick={toggleShuffle}
          className={`h-9 w-9 rounded-full grid place-items-center shrink-0 transition ${
            shuffle ? "text-primary bg-primary/10" : "text-foreground/55 hover:text-foreground"
          }`}
          aria-label="Lecture aléatoire"
        >
          <Shuffle className="h-4 w-4" />
        </button>
        <button
          onClick={prev}
          className="h-9 w-9 rounded-full grid place-items-center text-foreground/70 hover:text-foreground shrink-0"
          aria-label="Précédent"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={toggle}
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={next}
          className="h-9 w-9 rounded-full grid place-items-center text-foreground/70 hover:text-foreground shrink-0"
          aria-label="Suivant"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <button
          onClick={toggleLoop}
          className={`h-9 w-9 rounded-full grid place-items-center shrink-0 transition ${
            loop ? "text-primary bg-primary/10" : "text-foreground/55 hover:text-foreground"
          }`}
          aria-label="En boucle"
        >
          <Repeat className="h-4 w-4" />
        </button>
        <button
          onClick={stop}
          className="h-9 w-9 rounded-full grid place-items-center text-foreground/55 hover:text-foreground shrink-0"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mx-auto max-w-3xl h-1 bg-border rounded-full mt-1 overflow-hidden pointer-events-auto">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}