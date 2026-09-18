import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { RADIO_URL, RADIO_LOGO } from "@/lib/mediaConstants";
import { useMediaPlayerState } from "@/hooks/useMediaPlayerState";

const RadioContext = createContext(null);
export const useRadio = () => useContext(RadioContext);

const PREROLL_MS = 8000; // délai de démarrage : laisser le tampon prendre de l'avance
const RESUME_MS = 15000; // délai de reprise après une coupure réseau (tampon ~3 min via 12 tentives)

export function RadioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [retries, setRetries] = useState(0);
  const [preparing, setPreparing] = useState(false);
  // Volume maximal : la radio suit directement le volume système du téléphone.
  const [volume, setVolumeState] = useState(1);
  const attemptsRef = useRef(0);
  const preRollTimer = useRef(null);
  const resumeTimer = useRef(null);
  const prevStateRef = useRef("idle");

  // Machine à états partagée — radio en direct (isLive = true).
  const { state, errorCode } = useMediaPlayerState(audioRef, { isLive: true });

  const isPlaying = state === "playing";
  const isLoading = state === "connecting" || state === "buffering";
  const error = state === "error";

  const clearTimers = () => {
    if (preRollTimer.current) {
      clearTimeout(preRollTimer.current);
      preRollTimer.current = null;
    }
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };

  const updateMediaSession = (playing) => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: "Radio Chay",
        artist: "ÉGLISE CHAY",
        album: "En direct",
        artwork: [{ src: RADIO_LOGO, sizes: "512x512", type: "image/png" }],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {}
  };

  const loadStream = () => {
    const a = audioRef.current;
    if (!a) return;
    a.src = RADIO_URL;
    a.load();
  };

  const play = () => {
    const a = audioRef.current;
    if (a && !a.paused && !a.ended) return; // déjà en lecture
    clearTimers();
    attemptsRef.current = 0;
    setRetries(0);
    setPreparing(true);
    loadStream();
    // Pré-roll de 6 s : on attend que le tampon se remplisse avant de lancer le son.
    preRollTimer.current = setTimeout(() => {
      setPreparing(false);
      const aa = audioRef.current;
      if (aa) aa.play().catch(() => {});
    }, PREROLL_MS);
  };

  const stop = () => {
    clearTimers();
    setPreparing(false);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    attemptsRef.current = 0;
    setRetries(0);
    updateMediaSession(false);
  };

  const toggle = () => (isPlaying || isLoading || preparing ? stop() : play());

  const setVolume = (v) => {
    const c = Math.min(1, Math.max(0, v));
    setVolumeState(c);
    if (audioRef.current) audioRef.current.volume = c;
  };

  const retryNow = () => {
    clearTimers();
    attemptsRef.current = 0;
    setRetries(0);
    setPreparing(true);
    loadStream();
    preRollTimer.current = setTimeout(() => {
      setPreparing(false);
      const aa = audioRef.current;
      if (aa) aa.play().catch(() => {});
    }, PREROLL_MS);
  };

  // Reprise après coupure réseau : 2 s après un passage à l'erreur, on relance
  // la lecture. Plafonné à 5 tentatives pour éviter une boucle infinie.
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== "error" && state === "error" && !preparing) {
      attemptsRef.current += 1;
      setRetries(attemptsRef.current);
      if (attemptsRef.current <= 12) {
        clearTimers();
        resumeTimer.current = setTimeout(() => {
          const a = audioRef.current;
          if (a) {
            a.src = RADIO_URL;
            a.load();
            a.play().catch(() => {});
          }
        }, RESUME_MS);
      }
    }
    prevStateRef.current = state;
  }, [state]);

  useEffect(() => {
    updateMediaSession(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;

    // Interrupteur : toute autre lecture (musique ou vidéo) arrête la radio.
    const onAnyMediaPlay = (e) => {
      const el = e.target;
      if (!el || el === audioRef.current) return;
      if (el.tagName === "AUDIO" || el.tagName === "VIDEO") stop();
    };
    document.addEventListener("play", onAnyMediaPlay, true);

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => play());
        navigator.mediaSession.setActionHandler("pause", () => stop());
        navigator.mediaSession.setActionHandler("stop", () => stop());
      } catch {}
    }

    return () => {
      document.removeEventListener("play", onAnyMediaPlay, true);
      clearTimers();
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    state,
    preparing,
    isPlaying,
    isLoading,
    error,
    errorCode,
    retries,
    volume,
    play,
    stop,
    toggle,
    setVolume,
    retryNow,
  };

  return (
    <RadioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" className="hidden" />
    </RadioContext.Provider>
  );
}