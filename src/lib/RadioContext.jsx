import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { RADIO_URL, RADIO_LOGO } from "@/lib/mediaConstants";

const RadioContext = createContext(null);
export const useRadio = () => useContext(RadioContext);

export function RadioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const v = parseFloat(localStorage.getItem("chay_radio_volume"));
    return isNaN(v) ? 0.8 : Math.min(1, Math.max(0, v));
  });
  const attemptsRef = useRef(0);
  const retryTimer = useRef(null);

  const stopRetry = () => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  };

  const updateMediaSession = (playing) => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
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
    setError(false);
    setIsLoading(true);
    a.src = RADIO_URL;
    a.load();
    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  };

  const play = () => {
    const a = audioRef.current;
    if (a && !a.paused && !a.ended) return; // already playing
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
    setIsPlaying(false);
    setIsLoading(false);
    setError(false);
    setRetries(0);
    attemptsRef.current = 0;
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

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;

    const onPlaying = () => {
      setIsLoading(false);
      setError(false);
      setIsPlaying(true);
      attemptsRef.current = 0;
      setRetries(0);
      updateMediaSession(true);
    };
    const onWaiting = () => setIsLoading(true);
    const onPause = () => setIsPlaying(false);
    const onStalled = () => setIsLoading(true);
    const onError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setError(true);
      attemptsRef.current += 1;
      setRetries(attemptsRef.current);
      if (attemptsRef.current < 5) {
        stopRetry();
        retryTimer.current = setTimeout(() => attemptPlay(), 15000);
      }
    };

    a.addEventListener("playing", onPlaying);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("pause", onPause);
    a.addEventListener("stalled", onStalled);
    a.addEventListener("error", onError);

    // Interrupteur : toute autre lecture (musique ou vidéo) démarrée dans l'app
    // arrête automatiquement la radio. On écoute "play" en phase de capture car
    // l'événement ne remonte pas (ne bubble pas) depuis les <audio>/<video>.
    const onAnyMediaPlay = (e) => {
      const el = e.target;
      if (!el || el === audioRef.current) return; // la radio elle-même
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
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("stalled", onStalled);
      a.removeEventListener("error", onError);
      document.removeEventListener("play", onAnyMediaPlay, true);
      stopRetry();
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    isPlaying,
    isLoading,
    error,
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