import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import {
  buildWordProjectAudioUrl,
  isWordProjectAudioEnabled,
} from "@/lib/wordProjectAudio";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { cacheUrl, isUrlCached, getCachedUrlAsObjectUrl } from "@/lib/offlineCache";

const STORAGE_PREFIX = "bible_audio_pos_";

// Formate une durée en secondes → m:ss
function fmtTime(s) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Lecteur audio minimaliste pour la LSG (WordProject).
// Affiche le livre + chapitre au-dessus, un bouton play/pause centré,
// une barre de progression + tampon cliquable/glissable, et des flèches
// pour chapitre précédent / suivant. Volume géré par le système.
export default function BibleAudioPlayer({ book, chapter, onPrev, onNext }) {
  const barRef = useRef(null);
  const autoPlayNextRef = useRef(false);
  const {
    currentTrack,
    isPlaying: globalIsPlaying,
    currentTime: globalCurrentTime,
    duration: globalDuration,
    playerState,
    bufferedRatio,
    play,
    toggle,
    seek: globalSeek,
  } = useAudioPlayer();
  const enabled = isWordProjectAudioEnabled();
  const url = enabled ? buildWordProjectAudioUrl(book, chapter) : null;
  const posKey = book && chapter ? `${STORAGE_PREFIX}${book.order}_${chapter}` : null;

  const [dragging, setDragging] = useState(false);
  const [offlineAvailable, setOfflineAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const isCurrentTrack = currentTrack?.id === url;
  const isPlaying = isCurrentTrack && globalIsPlaying;
  const currentTime = isCurrentTrack ? globalCurrentTime : 0;
  const duration = isCurrentTrack ? globalDuration : 0;
  const loading = isCurrentTrack && (playerState === "connecting" || playerState === "buffering");

  useEffect(() => {
    if (!url) return;
    setDragging(false);
    isUrlCached(url).then(setOfflineAvailable);
    if (autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      playBibleChapter();
    }
  }, [url]);

  const playBibleChapter = useCallback(async () => {
    if (!url) return;
    const saved = posKey ? Number(localStorage.getItem(posKey)) : 0;
    // Hors-ligne : on privilégie la version mise en cache si disponible,
    // pour permettre la lecture audio sans connexion.
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    const audioSrc = offline ? (await getCachedUrlAsObjectUrl(url)) || url : url;
    play({
      id: url,
      title: `${book?.name || "Bible"} ${chapter}`,
      speaker: "Bible audio",
      mediaType: "bible",
      audio_url: audioSrc,
      initialTime: Number.isFinite(saved) && saved > 0 ? saved : 0,
      hasPrevious: Boolean(onPrev),
      hasNext: Boolean(onNext),
      previousAction: onPrev ? () => { autoPlayNextRef.current = true; onPrev(); } : null,
      nextAction: onNext ? () => { autoPlayNextRef.current = true; onNext(); } : null,
      onEnded: onNext ? () => { autoPlayNextRef.current = true; onNext(); } : null,
      onStop: (time) => {
        if (posKey && Number.isFinite(time)) localStorage.setItem(posKey, String(time));
      },
    });
  }, [url, posKey, book?.name, chapter, play, onPrev, onNext]);

  const handleDownload = useCallback(async (e) => {
    e.stopPropagation();
    if (!url || downloading || offlineAvailable) return;
    setDownloading(true);
    const ok = await cacheUrl(url);
    setDownloading(false);
    setOfflineAvailable(ok);
  }, [url, downloading, offlineAvailable]);

  // Sauvegarde périodique de la position d'écoute.
  useEffect(() => {
    if (!posKey) return;
    const id = setInterval(() => {
      if (isCurrentTrack && globalIsPlaying && Number.isFinite(globalCurrentTime) && globalCurrentTime > 0) {
        localStorage.setItem(posKey, String(globalCurrentTime));
      }
    }, 4000);
    return () => clearInterval(id);
  }, [posKey, isCurrentTrack, globalIsPlaying, globalCurrentTime]);

  const saveNow = useCallback(() => {
    if (posKey && isCurrentTrack && Number.isFinite(globalCurrentTime)) {
      localStorage.setItem(posKey, String(globalCurrentTime));
    }
  }, [posKey, isCurrentTrack, globalCurrentTime]);

  useEffect(() => {
    const onHide = () => saveNow();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      saveNow();
    };
  }, [saveNow]);

  const togglePlay = useCallback(() => {
    if (!url) return;
    if (isCurrentTrack) toggle();
    else playBibleChapter();
  }, [url, isCurrentTrack, toggle, playBibleChapter]);

  // ➕ NOUVEAU : seek par clic / glisser sur la barre
  const seekFromClientX = useCallback((clientX) => {
    const bar = barRef.current;
    if (!isCurrentTrack || !bar || !Number.isFinite(duration) || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    let ratio = (clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    const t = ratio * duration;
    globalSeek(t);
  }, [isCurrentTrack, duration, globalSeek]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    seekFromClientX(e.clientX);
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    seekFromClientX(e.clientX);
  };
  const handlePointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    saveNow();
  };

  if (!enabled) return null;
  if (!url) return null;

  const progressPct = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
  const bufferedPct = Math.max(0, Math.min(100, bufferedRatio * 100));

  return (
    <div className="border-b border-border bg-card px-5 py-5 md:px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <p className="text-center text-sm font-bold text-foreground">
            {book?.name} {chapter}
          </p>
          <button
            onClick={handleDownload}
            disabled={downloading || offlineAvailable}
            aria-label={offlineAvailable ? "Déjà disponible hors-ligne" : "Télécharger pour écoute hors-ligne"}
            title={offlineAvailable ? "Disponible hors-ligne" : "Télécharger pour écoute hors-ligne"}
            className="grid h-6 w-6 place-items-center rounded-full text-foreground/50 transition hover:bg-muted disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : offlineAvailable ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-8">
          <button
            onClick={() => { if (isPlaying) autoPlayNextRef.current = true; onPrev?.(); }}
            aria-label="Chapitre précédent"
            disabled={!onPrev}
            className="grid h-10 w-10 place-items-center rounded-xl text-foreground/70 transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Lire"}
            className="grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white shadow-sm transition hover:scale-105"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" />
            )}
          </button>

          <button
            onClick={() => { if (isPlaying) autoPlayNextRef.current = true; onNext?.(); }}
            aria-label="Chapitre suivant"
            disabled={!onNext}
            className="grid h-10 w-10 place-items-center rounded-xl text-foreground/70 transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* ➕ NOUVEAU : barre de progression + tampon + seek */}
        <div className="w-full max-w-xs mt-1">
          <div
            ref={barRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="slider"
            aria-label="Progression de lecture"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration) || 0}
            aria-valuenow={Math.round(currentTime) || 0}
            tabIndex={0}
            className="relative h-2 w-full cursor-pointer touch-none select-none rounded-full bg-muted"
          >
          {/* Tampon (ce qui est déjà téléchargé) — bleu doux */}
<div
  className="absolute inset-y-0 left-0 rounded-full bg-sky-400/30"
  style={{ width: `${bufferedPct}%` }}
/>
            {/* Progression lue */}
            <div
              className="absolute inset-y-0 left-0 rounded-full brand-gradient"
              style={{ width: `${progressPct}%` }}
            />
            {/* Curseur */}
            <div
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-2 ring-primary/40 transition-[width,height] ${
                dragging ? "h-4 w-4" : "h-3.5 w-3.5"
              }`}
              style={{ left: `${progressPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-semibold tabular-nums text-foreground/50">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        {isCurrentTrack && playerState === "error" && (
          <p className="text-xs text-destructive">Fichier audio indisponible pour ce chapitre.</p>
        )}
      </div>
    </div>
  );
}
