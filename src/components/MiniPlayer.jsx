import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Film,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Music,
  Pause,
  Play,
  Radio,
  Square,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import {
  subscribeMediaControl,
  stopActiveMediaControl,
} from "@/lib/mediaControl";
import { Image } from "@/components/ui/image";
import SeekBar from "@/components/player/SeekBar";
import PlayerFullscreen from "@/components/player/PlayerFullscreen";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";

const TYPE_LABELS = {
  audio: "Musique",
  music: "Musique",
  sermon: "Prédication",
  sermons: "Prédication",
  predication: "Prédication",
  bible: "Bible audio",
  video: "Film",
  youtube: "YouTube",
  radio: "Radio",
};

const AUDIO_TYPES = new Set(["audio", "music", "sermon", "sermons", "predication", "bible"]);

function getMediaIcon(type) {
  if (type === "radio") return Radio;
  if (type === "video" || type === "film") return Film;
  if (["sermon", "sermons", "predication"].includes(type)) return Headphones;
  if (type === "gallery") return ImageIcon;
  return Music;
}

export default function MiniPlayer() {
  const [control, setControl] = useState(null);
  const [audioExpanded, setAudioExpanded] = useState(false);
  const audioPlayer = useAudioPlayer();

  useEffect(() => subscribeMediaControl(setControl), []);
  useEffect(() => setAudioExpanded(false), [control?.id]);

  if (!control) return null;
  const Icon = getMediaIcon(control.type);
  const isRadio = control.isLive || control.type === "radio";
  const isBuffering = control.isBuffering;
  const typeLabel = TYPE_LABELS[control.type] || "Média";
  const label = control.subtitle && control.subtitle !== typeLabel
    ? `${typeLabel} · ${control.subtitle}`
    : typeLabel;
  const isAudio = AUDIO_TYPES.has(control.type) || control.engine === "audio";
  const playbackStatus = isBuffering
    ? "Chargement…"
    : control.isPlaying
      ? "En lecture"
      : "En pause";

  return (
    <>
      <AnimatePresence>
        {control && (
          <motion.div
            key={String(control.id)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:bottom-4 inset-x-0 z-[55] px-3 pointer-events-none"
          >
            <section
              aria-label="Mini-lecteur multimédia"
              className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card/95 shadow-xl backdrop-blur-xl pointer-events-auto"
            >
              <div className="flex min-h-16 items-center gap-2 px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isAudio) setAudioExpanded(true);
                    else control.open?.();
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Ouvrir le lecteur : ${control.title}`}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                    {control.artwork ? (
                      <Image src={control.artwork} alt="" fittingType="fill" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">{control.title}</span>
                    <span className="block truncate text-xs text-foreground/60">
                      {isRadio ? "LIVE" : label}
                      {!isRadio && ` · ${playbackStatus}`}
                    </span>
                  </span>
                </button>

                {control.previous && (
                  <button
                    type="button"
                    onClick={control.previous}
                    aria-label="Précédent"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <SkipBack className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={control.toggle}
                  aria-label={isRadio ? "Arrêter la radio" : control.isPlaying ? "Pause" : "Lecture"}
                  aria-pressed={Boolean(control.isPlaying)}
                  disabled={!control.toggle}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-70"
                >
                  {isBuffering ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : isRadio ? (
                    <Square className="h-4 w-4" aria-hidden="true" />
                  ) : control.isPlaying ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                {control.next && (
                  <button
                    type="button"
                    onClick={control.next}
                    aria-label="Suivant"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/70 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <SkipForward className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopActiveMediaControl}
                  aria-label="Arrêter et fermer le lecteur"
                  title="Arrêter"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/55 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {isRadio ? (
                <div className="flex items-center gap-2 px-4 pb-2 text-[0.65rem] font-bold uppercase tracking-wide text-red-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> En direct
                </div>
              ) : control.duration > 0 && control.seek ? (
                <div className="px-3 pb-2">
                  <SeekBar
                    currentTime={control.currentTime || 0}
                    duration={control.duration}
                    onSeek={control.seek}
                    bufferedRatio={control.bufferedRatio || 0}
                  />
                </div>
              ) : null}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {audioExpanded && isAudio && audioPlayer.currentTrack && (
        <PlayerFullscreen
          onCollapse={() => setAudioExpanded(false)}
          cover={control.artwork}
        />
      )}
    </>
  );
}
