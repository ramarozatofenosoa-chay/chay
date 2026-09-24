import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import {
  buildWordProjectAudioUrl,
  isWordProjectAudioEnabled,
} from "@/lib/wordProjectAudio";

const STORAGE_PREFIX = "bible_audio_pos_";

// Formate une durée en secondes → m:ss
function fmtTime(s) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Calcule le ratio tamponné (0..1) depuis audio.buffered.
function getBufferedRatio(a) {
  if (!a || !a.buffered || a.buffered.length === 0) return 0;
  if (!Number.isFinite(a.duration) || a.duration <= 0) return 0;
  // Pour un MP3 progressif, la dernière plage représente le plus avancé téléchargé.
  const end = a.buffered.end(a.buffered.length - 1);
  return Math.max(0, Math.min(1, end / a.duration));
}

// Lecteur audio minimaliste pour la LSG (WordProject).
// Affiche le livre + chapitre au-dessus, un bouton play/pause centré,
// une barre de progression + tampon cliquable/glissable, et des flèches
// pour chapitre précédent / suivant. Volume géré par le système.
export default function BibleAudioPlayer({ book, chapter, onPrev, onNext }) {
  const audioRef = useRef(null);
  const barRef = useRef(null);
  const autoPlayNextRef = useRef(false);
  const enabled = isWordProjectAudioEnabled();
  const url = enabled ? buildWordProjectAudioUrl(book, chapter) : null;
  const posKey = book && chapter ? `${STORAGE_PREFIX}${book.order}_${chapter}` : null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ➕ NOUVEAU : états pour la barre de progression / tampon / seek
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedRatio, setBufferedRatio] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !url) return;
    setIsPlaying(false);
    setError("");
    setLoading(true);
    // ➕ NOUVEAU : reset des états de progression au changement de chapitre
    setCurrentTime(0);
    setDuration(0);
    setBufferedRatio(0);
    setDragging(false);
    audioRef.current.load();
  }, [url]);

  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 1; // volume maximal → contrôlé par le système
    // ➕ NOUVEAU : récupérer la durée + tampon initial
    setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    setBufferedRatio(getBufferedRatio(a));
    if (posKey) {
      const saved = Number(localStorage.getItem(posKey));
      if (Number.isFinite(saved) && saved > 0 && saved < (a.duration || Infinity)) {
        try {
          a.currentTime = saved;
          setCurrentTime(saved); // ➕ NOUVEAU :同步 la barre à la position reprise
        } catch { /* seek pas encore prêt */ }
      }
    }
    setLoading(false);
    if (autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      a.play().catch(() => {});
    }
  };

  // ➕ NOUVEAU : mise à jour continue de la position + du tampon pendant la lecture
  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    if (Number.isFinite(a.currentTime)) setCurrentTime(a.currentTime);
    setBufferedRatio(getBufferedRatio(a));
  };
  const onProgress = () => {
    const a = audioRef.current;
    if (a) setBufferedRatio(getBufferedRatio(a));
  };

  // Sauvegarde périodique de la position d'écoute.
  useEffect(() => {
    if (!posKey) return;
    const id = setInterval(() => {
      const a = audioRef.current;
      if (a && !a.paused && Number.isFinite(a.currentTime) && a.currentTime > 0) {
        localStorage.setItem(posKey, String(a.currentTime));
      }
    }, 4000);
    return () => clearInterval(id);
  }, [posKey]);

  const saveNow = useCallback(() => {
    const a = audioRef.current;
    if (posKey && a && Number.isFinite(a.currentTime)) {
      localStorage.setItem(posKey, String(a.currentTime));
    }
  }, [posKey]);

  useEffect(() => {
    const onHide = () => saveNow();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
      saveNow();
    };
  }, [saveNow]);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a || !url) return;
    try {
      if (a.paused) await a.play();
      else a.pause();
    } catch {
      setError("Lecture bloquée par le navigateur. Appuyez à nouveau sur Lire.");
    }
  };

  // ➕ NOUVEAU : seek par clic / glisser sur la barre
  const seekFromClientX = useCallback((clientX) => {
    const a = audioRef.current;
    const bar = barRef.current;
    if (!a || !bar) return;
    if (!Number.isFinite(a.duration) || a.duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    let ratio = (clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    const t = ratio * a.duration;
    try { a.currentTime = t; } catch { /* ignore */ }
    setCurrentTime(t);
  }, []);

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
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        onLoadedMetadata={onLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); saveNow(); if (onNext) { autoPlayNextRef.current = true; onNext(); } }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setLoading(false); setError(""); }}
        onError={() => {
          setIsPlaying(false);
          setLoading(false);
          setError("Fichier audio indisponible pour ce chapitre.");
        }}
        onTimeUpdate={onTimeUpdate}      // ➕ NOUVEAU
        onProgress={onProgress}          // ➕ NOUVEAU
      />

      <div className="flex flex-col items-center gap-3">
        <p className="text-center text-sm font-bold text-foreground">
          {book?.name} {chapter}
        </p>

        <div className="flex items-center gap-8">
          <button
            onClick={() => { if (isPlaying) autoPlayNextRef.current = true; onPrev(); }}
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
            onClick={() => { if (isPlaying) autoPlayNextRef.current = true; onNext(); }}
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
            {/* Tampon (ce qui est déjà téléchargé) */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-foreground/15"
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

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
