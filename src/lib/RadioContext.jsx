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

export function RadioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [retries, setRetries] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const v = parseFloat(localStorage.getItem("chay_radio_volume"));
    return isNaN(v) ? 0.8 : Math.min(1, Math.max(0, v));
  });
  const attemptsRef = useRef(0);
  const retryTimer = useRef(null);
  const prevErrorRef = useRef(false);

  // Machine à états partagée — radio en direct (isLive = true).
  const { state, errorCode } = useMediaPlayerState(audioRef, { isLive: true });

  const isPlaying = state === "playing";
  const isLoading = state === "connecting" || state === "buffering";
  const error = state === "error";

  const stopRetry = () => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
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

  const attemptPlay = () => {
    const a = audioRef.current;
    if (!a) return;
    a.src = RADIO_URL;
    a.load();
    a.play().catch(() => {});
  };

  const play = () => {
    const a = audioRef.current;
    if (a && !a.paused && !a.ended) return; // déjà en lecture
    stopRetry();
    attemptsRef.current = 0;
    setRetries(0);
    attemptPlay();
  };

  const stop = () => {
    stopRetry();
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

  const toggle = () => (isPlaying || isLoading ? stop() : play());

  const setVolume = (v) => {
    const c = Math.min(1, Math.max(0, v));
    setVolumeState(c);
    localStorage.setItem("chay_radio_volume", String(c));
    if (audioRef.current) audioRef.current.volume = c;
  };

  const retryNow = () => {
    stopRetry();
    attemptsRef.current = 0;
    setRetries(0);
    attemptPlay();
  };

  // Retry automatique sur erreur (5 tentatives, 15s d'intervalle).
  useEffect(() => {
    if (!prevErrorRef.current && error) {
      attemptsRef.current += 1;
      setRetries(attemptsRef.current);
      if (attemptsRef.current < 5) {
        stopRetry();
        retryTimer.current = setTimeout(() => attemptPlay(), 15000);
      }
    }
    prevErrorRef.current = error;
  }, [error]);

  // La session média suit l'état réel.
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
      if (el.tagName === "AUDIO" || el.tagName === "VIDEO") {
        stop();
      }
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
      stopRetry();
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    state,
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