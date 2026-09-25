import { useEffect, useRef, useState, useCallback } from "react";

// États partagés par tous les lecteurs (Radio, Musique, Prédications, Vidéos).
// Une seule machine à états, sans logique dupliquée.
//   idle        — aucune source assignée
//   connecting  — source assignée (loadstart), rien de jouable encore
//   buffering    — lecture interrompue faute de données, après un premier canplay
//   playing     — lecture en cours
//   paused      — en pause (y compris juste après canplay si lecture non demandée)
//   error       — flux en échec / connexion perdue
// errorTimeoutMs : durée au-delà de laquelle une lecture bloquée devient une
// panne. Une micro-coupure de 3 s est fréquente et normale sur réseau mobile :
// on attend bien plus longtemps avant d'interrompre la lecture pour si peu.
export function useMediaPlayerState(mediaRef, { isLive = false, errorTimeoutMs = 15000 } = {}) {
  const [state, setState] = useState("idle");
  const [bufferedRatio, setBufferedRatio] = useState(0);
  const [errorCode, setErrorCode] = useState(undefined);

  const hadCanPlayRef = useRef(false);
  const playRequestedRef = useRef(false);
  const stalledTimerRef = useRef(null);
  const prevErrorRef = useRef(false);

  const clearStalledTimer = () => {
    if (stalledTimerRef.current) {
      clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = null;
    }
  };

  useEffect(() => {
    const el = mediaRef && mediaRef.current;
    if (!el) return undefined;

    hadCanPlayRef.current = false;
    prevErrorRef.current = false;

    const startStalledHeuristic = () => {
      clearStalledTimer();
      stalledTimerRef.current = setTimeout(() => {
        const e = mediaRef.current;
        if (!e) return;
        // stalled sans progress ni playing pendant errorTimeoutMs → error
        if (e.readyState < 3 && !e.paused) {
          setErrorCode(undefined);
          setState("error");
        }
      }, errorTimeoutMs);
    };

    const onLoadStart = () => {
      hadCanPlayRef.current = false;
      prevErrorRef.current = false;
      setErrorCode(undefined);
      setBufferedRatio(0);
      setState("connecting");
    };
    const onPlay = () => {
      playRequestedRef.current = true;
    };
    const onCanPlay = () => {
      hadCanPlayRef.current = true;
      setState((s) => {
        if (s === "connecting") return playRequestedRef.current ? "connecting" : "paused";
        return s;
      });
    };
    const onCanPlayThrough = () => {
      hadCanPlayRef.current = true;
      setState((s) => {
        if (s === "connecting" && !playRequestedRef.current) return "paused";
        return s;
      });
    };
    const onPlaying = () => {
      clearStalledTimer();
      playRequestedRef.current = true;
      setState("playing");
    };
    const onPause = () => {
      playRequestedRef.current = false;
      setState("paused");
    };
    const onWaiting = () => {
      setState((s) => {
        if (hadCanPlayRef.current && playRequestedRef.current && s !== "paused") return "buffering";
        if (s === "connecting") return "connecting";
        return s;
      });
      startStalledHeuristic();
    };
    const onStalled = () => {
      startStalledHeuristic();
    };
    const onProgress = () => {
      clearStalledTimer();
      if (isLive) return;
      const e = mediaRef.current;
      if (e && e.buffered && e.buffered.length) {
        try {
          const dur = e.duration;
          if (isFinite(dur) && dur > 0) {
            let end = 0;
            for (let i = 0; i < e.buffered.length; i++) end = Math.max(end, e.buffered.end(i));
            setBufferedRatio(Math.min(1, end / dur));
          }
        } catch {}
      }
    };
    const onError = () => {
      clearStalledTimer();
      const e = mediaRef.current;
      setErrorCode(e && e.error ? e.error.code : undefined);
      setState("error");
    };
    const onEmptied = () => {
      hadCanPlayRef.current = false;
      setBufferedRatio(0);
      setState("idle");
    };
    const onEnded = () => {
      // la fin de piste est gérée par le lecteur (contexte) ; on reste dans l'état courant
    };

    el.addEventListener("loadstart", onLoadStart);
    el.addEventListener("play", onPlay);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("canplaythrough", onCanPlayThrough);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("stalled", onStalled);
    el.addEventListener("progress", onProgress);
    el.addEventListener("error", onError);
    el.addEventListener("emptied", onEmptied);
    el.addEventListener("ended", onEnded);

    return () => {
      clearStalledTimer();
      el.removeEventListener("loadstart", onLoadStart);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("canplaythrough", onCanPlayThrough);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("stalled", onStalled);
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("error", onError);
      el.removeEventListener("emptied", onEmptied);
      el.removeEventListener("ended", onEnded);
    };
  }, [mediaRef, errorTimeoutMs, isLive]);

  // Seek optimiste : renvoie true si la cible était déjà tamponnée (lecture immédiate),
  // false si mise en attente (l'état passe à buffering et la lecture reprend dès que le
  // tampon atteint la cible).
  const seek = useCallback(
    (target) => {
      const el = mediaRef && mediaRef.current;
      if (!el || !isFinite(target)) return false;
      const dur = el.duration;
      if (!isFinite(dur) || dur <= 0) return false;
      const t = Math.min(dur, Math.max(0, target));
      let bufferedEnd = 0;
      try {
        for (let i = 0; i < el.buffered.length; i++)
          bufferedEnd = Math.max(bufferedEnd, el.buffered.end(i));
      } catch {}
      const wasPlaying = !el.paused && !el.ended;
      try {
        el.currentTime = t;
      } catch {
        return false;
      }
      if (t > bufferedEnd) {
        setState("buffering");
        const onPlayingOnce = () => el.removeEventListener("playing", onPlayingOnce);
        el.addEventListener("playing", onPlayingOnce);
        if (wasPlaying) el.play().catch(() => {});
        return false;
      }
      return true;
    },
    [mediaRef]
  );

  return { state, bufferedRatio, isLive, errorCode, seek };
}