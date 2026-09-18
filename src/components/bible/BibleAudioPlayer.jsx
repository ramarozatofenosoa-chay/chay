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

// Lecteur audio minimaliste pour la LSG (WordProject).
// Affiche le livre + chapitre au-dessus, un bouton play/pause centré,
// et des flèches pour chapitre précédent / suivant. Volume géré par le
// système (volume du téléphone) — aucun contrôle de volume à l'écran.
export default function BibleAudioPlayer({ book, chapter, onPrev, onNext }) {
  const audioRef = useRef(null);
  const autoPlayNextRef = useRef(false);
  const enabled = isWordProjectAudioEnabled();
  const url = enabled ? buildWordProjectAudioUrl(book, chapter) : null;
  const posKey = book && chapter ? `${STORAGE_PREFIX}${book.order}_${chapter}` : null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!audioRef.current || !url) return;
    setIsPlaying(false);
    setError("");
    setLoading(true);
    audioRef.current.load();
  }, [url]);

  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 1; // volume maximal → contrôlé par le système
    if (posKey) {
      const saved = Number(localStorage.getItem(posKey));
      if (Number.isFinite(saved) && saved > 0 && saved < (a.duration || Infinity)) {
        try { a.currentTime = saved; } catch { /* seek pas encore prêt */ }
      }
    }
    setLoading(false);
    if (autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      a.play().catch(() => {});
    }
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

  if (!enabled) return null;
  if (!url) return null;

  return (
    <div className="border-b border-border bg-card px-5 py-5 md:px-6">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
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

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}