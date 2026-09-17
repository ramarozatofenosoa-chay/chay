import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  FastForward,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  WORDPROJECT_DISCLAIM_URL,
  buildWordProjectAudioUrl,
  isWordProjectAudioEnabled,
} from "@/lib/wordProjectAudio";

function fmt(t) {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STORAGE_PREFIX = "bible_audio_pos_";

// Lecteur audio HTML5 pour la LSG (WordProject). Lecture/pause/reprise, ±10 s,
// barre de progression + durée/temps écoulé, volume + muet, chargement
// automatique au changement de livre/chapitre, mémorisation et reprise de la
// position, gestion d'erreurs, attribution de la source.
export default function BibleAudioPlayer({ book, chapter }) {
  const audioRef = useRef(null);
  const enabled = isWordProjectAudioEnabled();
  const url = enabled ? buildWordProjectAudioUrl(book, chapter) : null;
  const posKey = book && chapter ? `${STORAGE_PREFIX}${book.order}_${chapter}` : null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Recharge le fichier quand le livre ou le chapitre change (sans autoplay).
  useEffect(() => {
    if (!audioRef.current || !url) return;
    setIsPlaying(false);
    setCurrent(0);
    setDuration(0);
    setError("");
    setLoading(true);
    audioRef.current.load();
  }, [url]);

  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (!a) return;
    setDuration(a.duration || 0);
    setVolume(a.volume ?? 1);
    setMuted(a.muted || false);
    if (posKey) {
      const saved = Number(localStorage.getItem(posKey));
      if (Number.isFinite(saved) && saved > 0 && saved < (a.duration || Infinity)) {
        try { a.currentTime = saved; } catch { /* seek pas encore prêt */ }
      }
    }
    setLoading(false);
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (a) setCurrent(a.currentTime);
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

  const skip = (delta) => {
    const a = audioRef.current;
    if (!a) return;
    const t = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
    a.currentTime = t;
    setCurrent(t);
  };

  const onSeek = (e) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const t = Number(e.target.value);
    a.currentTime = t;
    setCurrent(t);
  };

  const onVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    const next = !a.muted;
    a.muted = next;
    setMuted(next);
    if (!next && a.volume === 0) { a.volume = 0.5; setVolume(0.5); }
  };

  if (!enabled) {
    return (
      <div className="border-b border-border bg-muted/40 px-5 py-4 md:px-6">
        <div className="flex items-start gap-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground/80">
              L'audio de la Louis Segond 1910 n'est pas encore autorisé ou configuré.
            </p>
            <a
              href={WORDPROJECT_DISCLAIM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline"
            >
              Conditions WordProject <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!url) return null;

  return (
    <div className="border-b border-border bg-card px-5 py-4 md:px-6">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); saveNow(); }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setLoading(false); setError(""); }}
        onError={() => {
          setIsPlaying(false);
          setLoading(false);
          setError("Fichier audio indisponible pour ce chapitre (source WordProject).");
        }}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Lire"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-sm transition hover:scale-105"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="ml-0.5 h-6 w-6" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">Audio — {book?.name} {chapter}</p>
          <p className="truncate text-[11px] text-muted-foreground">Source : WordProject.org · Louis Segond 1910</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="w-10 text-right tabular-nums text-[11px] text-muted-foreground">{fmt(current)}</span>
        <input
          type="range" min={0} max={duration || 0} step={0.1} value={current}
          onChange={onSeek}
          aria-label="Progression"
          className="flex-1 accent-primary"
        />
        <span className="w-10 tabular-nums text-[11px] text-muted-foreground">{fmt(duration)}</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button onClick={() => skip(-10)} aria-label="Reculer de 10 secondes" className="grid h-9 w-9 place-items-center rounded-xl border border-border transition hover:bg-muted">
          <RotateCcw className="h-4 w-4 text-foreground/70" />
        </button>
        <button onClick={() => skip(10)} aria-label="Avancer de 10 secondes" className="grid h-9 w-9 place-items-center rounded-xl border border-border transition hover:bg-muted">
          <FastForward className="h-4 w-4 text-foreground/70" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleMute} aria-label={muted ? "Activer le son" : "Couper le son"} className="grid h-9 w-9 place-items-center rounded-xl border border-border transition hover:bg-muted">
            {muted || volume === 0 ? <VolumeX className="h-4 w-4 text-foreground/70" /> : <Volume2 className="h-4 w-4 text-foreground/70" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
            onChange={onVolume} aria-label="Volume"
            className="w-20 accent-primary"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Audio : WordProject.org — Louis Segond 1910. Utilisation réservée à l'évangélisation
        chrétienne non commerciale. Aucune publicité, vente ou utilisation commerciale.{" "}
        <a href={WORDPROJECT_DISCLAIM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary underline">
          Conditions <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}