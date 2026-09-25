import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { RADIO_URL, RADIO_LOGO } from "@/lib/mediaConstants";
import { isRadioMseSupported, startRadioStream } from "@/lib/radioMse";
import { useMediaPlayerState } from "@/hooks/useMediaPlayerState";

const RadioContext = createContext(null);
export const useRadio = () => useContext(RadioContext);

// Pré-roll adaptatif : on lance le son dès que le tampon contient
// PREROLL_MIN_BUFFER_S secondes (au plus tôt après PREROLL_MIN_MS), avec un
// plafond dur de PREROLL_MAX_MS ms. Là où l'ancien code attendait toujours
// 8 s avant le moindre son, on lance dès que le tampon est prêt.
const PREROLL_MAX_MS = 5000;
const PREROLL_MIN_MS = 1200;
// MSE : le backlog serveur arrive en bloc, 2 s de tampon sont atteintes en
// moins d'une seconde. Repli <audio> : Chrome plafonne à ~2,2 s. Un seuil
// supérieur à 2 s nous projeterait donc sur le plafond du repli — on garde 2 s.
const PREROLL_MIN_BUFFER_S = 2;
// Lecture MSE disponible (Chrome/Edge et Android). Sinon : chemin <audio>.
const USE_MSE = isRadioMseSupported();
const RESUME_MS = 6000; // délai de reprise après une coupure réseau
// Tolérance avant de déclarer une panne : 3 s sans données est fréquent et
// normal sur réseau mobile, ce n'est pas une panne.
const RADIO_STALL_MS = 25000;

export const MAX_RADIO_RETRIES = 12;

export function RadioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [retries, setRetries] = useState(0);
  const [preparing, setPreparing] = useState(false);
  // Volume maximal : la radio suit directement le volume système du téléphone.
  const [volume, setVolumeState] = useState(1);
  const attemptsRef = useRef(0);
  const preRollTimer = useRef(null);
  const prerollPoll = useRef(null);
  const resumeTimer = useRef(null);
  const prevStateRef = useRef("idle");
  // Flux MSE en cours (null en mode repli <audio>).
  const streamRef = useRef(null);

  // Machine à états partagée — radio en direct (isLive = true).
  const { state, errorCode } = useMediaPlayerState(audioRef, {
    isLive: true,
    errorTimeoutMs: RADIO_STALL_MS,
  });

  const isPlaying = state === "playing";
  const isLoading = state === "connecting" || state === "buffering";
  const error = state === "error";

  const clearTimers = () => {
    if (preRollTimer.current) {
      clearTimeout(preRollTimer.current);
      preRollTimer.current = null;
    }
    if (prerollPoll.current) {
      clearInterval(prerollPoll.current);
      prerollPoll.current = null;
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

  const stopStream = () => {
    const s = streamRef.current;
    if (!s) return;
    streamRef.current = null;
    try {
      s.stop();
    } catch {}
  };

  // Échec du flux MSE (réseau coupé, flux fermé) : on le remonte comme une
  // erreur du <audio> pour réutiliser la reprise existante (6 s, 12 essais).
  const onStreamFailed = () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.dispatchEvent(new Event("error"));
    } catch {}
  };

  const loadStream = () => {
    const a = audioRef.current;
    if (!a) return;
    stopStream();
    if (USE_MSE) {
      streamRef.current = startRadioStream(a, RADIO_URL, { onFailed: onStreamFailed });
      if (streamRef.current) return; // on lit nous-mêmes les octets du flux
    }
    a.src = RADIO_URL;
    a.load();
  };

  // Pré-roll adaptatif : on lance le son dès que le tampon contient
  // PREROLL_MIN_BUFFER_S secondes, sans jamais dépasser PREROLL_MAX_MS.
  const beginPreroll = () => {
    clearTimers();
    let done = false;

    const bufferedSeconds = () => {
      try {
        const el = audioRef.current;
        if (!el || !el.buffered.length) return 0;
        return el.buffered.end(el.buffered.length - 1) - el.buffered.start(0);
      } catch {
        return 0;
      }
    };

    const finish = () => {
      if (done) return;
      done = true;
      clearTimers();
      setPreparing(false);
      const el = audioRef.current;
      if (el) el.play().catch(() => {});
    };

    const startedAt = Date.now();
    prerollPoll.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < PREROLL_MIN_MS) return;
      if (bufferedSeconds() >= PREROLL_MIN_BUFFER_S || elapsed >= PREROLL_MAX_MS) finish();
    }, 200);
    preRollTimer.current = setTimeout(finish, PREROLL_MAX_MS);
  };

  const play = () => {
    const a = audioRef.current;
    if (a && !a.paused && !a.ended) return; // déjà en lecture
    clearTimers();
    attemptsRef.current = 0;
    setRetries(0);
    setPreparing(true);
    loadStream();
    beginPreroll();
  };

  const stop = () => {
    clearTimers();
    setPreparing(false);
    stopStream();
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
    beginPreroll();
  };

  // Reprise après coupure réseau : après un passage à l'erreur, on relance la
  // lecture. Plafonné à 12 tentatives pour éviter une boucle infinie.
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== "error" && state === "error" && !preparing) {
      attemptsRef.current += 1;
      setRetries(attemptsRef.current);
      if (attemptsRef.current <= MAX_RADIO_RETRIES) {
        clearTimers();
        resumeTimer.current = setTimeout(() => {
          // Même chemin qu'un démarrage normal : on affiche « Connexion… »
          // et on laisse le tampon se remplir avant de relancer le son.
          setPreparing(true);
          loadStream();
          beginPreroll();
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
      stopStream();
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
      <audio ref={audioRef} preload="auto" className="hidden" />
    </RadioContext.Provider>
  );
}