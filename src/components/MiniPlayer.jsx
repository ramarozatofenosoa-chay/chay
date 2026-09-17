import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  X,
  Loader2,
} from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { Image } from "@/components/ui/image";
import SeekBar from "@/components/player/SeekBar";
import PlayerFullscreen from "@/components/player/PlayerFullscreen";

export default function MiniPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const {
    currentTrack,
    isPlaying,
    toggle,
    next,
    prev,
    shuffle,
    loop,
    toggleShuffle,
    toggleLoop,
    stop,
    currentTime,
    duration,
    seek,
    playerState,
    bufferedRatio,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const buffering = playerState === "connecting" || playerState === "buffering";
  const cover = currentTrack.cover_url;
  const LoopIcon = loop === "one" ? Repeat1 : Repeat;

  if (minimized) {
    return (
      <>
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-20 right-3 z-50 h-12 w-12 rounded-full bg-card border border-border shadow-lg overflow-hidden grid place-items-center"
          aria-label="Réouvrir le lecteur"
        >
          {cover ? (
            <Image src={cover} fittingType="fill" className="w-full h-full" />
          ) : (
            <span className="w-full h-full brand-gradient grid place-items-center">
              <Music className="h-5 w-5 text-white/90" />
            </span>
          )}
        </button>
        {expanded && (
          <PlayerFullscreen onCollapse={() => setExpanded(false)} cover={cover} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-20 md:bottom-4 inset-x-0 z-50 px-3 pointer-events-none">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-lg pointer-events-auto overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
              aria-label="Agrandir le lecteur"
            >
              <div className="h-11 w-11 rounded-xl overflow-hidden shrink-0">
                {cover ? (
                  <Image src={cover} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full brand-gradient grid place-items-center">
                    <Music className="h-5 w-5 text-white/90" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{currentTrack.title}</div>
                <div className="text-xs text-foreground/55 truncate">
                  {currentTrack.artist || currentTrack.speaker || "Chay"}
                </div>
              </div>
            </button>

            <button
              onClick={toggleShuffle}
              className={`hidden sm:grid h-9 w-9 place-items-center rounded-full shrink-0 transition ${
                shuffle ? "text-primary bg-primary/10" : "text-foreground/55 hover:text-foreground"
              }`}
              aria-label="Lecture aléatoire"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              onClick={prev}
              className="h-9 w-9 grid place-items-center text-foreground/70 hover:text-foreground shrink-0"
              aria-label="Précédent"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={toggle}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {buffering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={next}
              className="h-9 w-9 grid place-items-center text-foreground/70 hover:text-foreground shrink-0"
              aria-label="Suivant"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={toggleLoop}
              className={`hidden sm:grid h-9 w-9 place-items-center rounded-full shrink-0 transition relative ${
                loop !== "off" ? "text-primary bg-primary/10" : "text-foreground/55 hover:text-foreground"
              }`}
              aria-label="Lecture en boucle"
            >
              <LoopIcon className="h-4 w-4" />
              {loop === "all" && (
                <span className="absolute -bottom-0.5 text-[7px] font-extrabold leading-none">∞</span>
              )}
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="h-9 w-9 grid place-items-center text-foreground/55 hover:text-foreground shrink-0"
              aria-label="Réduire le lecteur"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 pb-2">
            <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} bufferedRatio={bufferedRatio} />
          </div>
        </div>
      </div>

      {expanded && (
        <PlayerFullscreen onCollapse={() => setExpanded(false)} cover={cover} />
      )}
    </>
  );
}