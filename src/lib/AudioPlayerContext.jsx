import { useMediaSessionSync } from "@/hooks/useMediaSessionSync";
import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { useMediaPlayerState } from "@/hooks/useMediaPlayerState";

const AudioPlayerContext = createContext();

function shuffledIndices(n, startAt = 0) {
  if (n <= 0) return [];
  const rest = Array.from({ length: n }, (_, i) => i).filter((i) => i !== startAt);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [startAt, ...rest];
}

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [order, setOrder] = useState([]);
  const [orderIndex, setOrderIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState("off"); // "off" | "all" | "one"

  const stateRef = useRef({});
  stateRef.current = { queue, order, orderIndex, loop, shuffle, currentTrack, currentTime };

  // Machine à états partagée (tamponnage) — musique & prédications.
  const { state: playerState, bufferedRatio, seek: optimisticSeek } =
    useMediaPlayerState(audioRef, { isLive: false });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audio_url;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [currentTrack]);

  // Toute autre lecture (radio, vidéo) démarrée dans l'app met la musique en pause.
  useEffect(() => {
    const onOtherPlay = (e) => {
      const el = e.target;
      if (!el || el === audioRef.current) return;
      if (el.tagName === "AUDIO" || el.tagName === "VIDEO") {
        const a = audioRef.current;
        if (a && !a.paused) a.pause();
      }
    };
    document.addEventListener("play", onOtherPlay, true);
    return () => document.removeEventListener("play", onOtherPlay, true);
  }, []);

  const playAt = useCallback((newIndex) => {
    const { order, queue } = stateRef.current;
    if (!order.length) return;
    const wrapped = ((newIndex % order.length) + order.length) % order.length;
    setOrderIndex(wrapped);
    setCurrentTrack(queue[order[wrapped]]);
  }, []);

  const playQueue = useCallback((tracks, startIndex = 0) => {
    const list = (tracks || []).filter((t) => t?.audio_url);
    if (!list.length) return;
    const idx = Math.max(0, Math.min(startIndex, list.length - 1));
    setQueue(list);
    let ord, start;
    if (stateRef.current.shuffle) {
      ord = shuffledIndices(list.length, idx);
      start = 0;
    } else {
      ord = Array.from({ length: list.length }, (_, i) => i);
      start = idx;
    }
    setOrder(ord);
    setOrderIndex(start);
    setCurrentTrack(list[ord[start]]);
  }, []);

  const play = useCallback((track) => {
    if (!track?.audio_url) return;
    if (currentTrack?.id === track.id) {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
      return;
    }
    setQueue([track]);
    setOrder([0]);
    setOrderIndex(0);
    setCurrentTrack(track);
  }, [currentTrack?.id]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) audio.play().then(() => setIsPlaying(true)).catch(() => {});
    else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const next = useCallback(() => playAt(stateRef.current.orderIndex + 1), [playAt]);
  const prev = useCallback(() => {
    const audio = audioRef.current;
    const { currentTime, orderIndex } = stateRef.current;
    if (audio && currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (orderIndex > 0) playAt(orderIndex - 1);
    else if (audio) audio.currentTime = 0;
  }, [playAt]);

  const seek = (t) => optimisticSeek(t);

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setQueue([]);
    setOrder([]);
    setOrderIndex(0);
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

     // --- SYNCHRONISATION MEDIA SESSION ANDROID ---
   useMediaSessionSync({
     isPlaying,
     currentTrack,
     onPlayPause: toggle, // Passe la fonction toggle existante
     onNext: next,        // Passe la fonction next existante
     onPrev: prev,        // Passe la fonction prev existante
     onStop: stop         // Passe la fonction stop existante
   });
  
  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const ns = !s;
      const { queue, currentTrack } = stateRef.current;
      if (queue.length) {
        const curIdx = currentTrack ? queue.findIndex((t) => t.id === currentTrack.id) : -1;
        if (ns) {
          const ord = shuffledIndices(queue.length, Math.max(0, curIdx));
          setOrder(ord);
          setOrderIndex(0);
        } else {
          const ord = Array.from({ length: queue.length }, (_, i) => i);
          setOrder(ord);
          setOrderIndex(Math.max(0, curIdx));
        }
      }
      return ns;
    });
  }, []);

  const toggleLoop = useCallback(
    () => setLoop((l) => (l === "off" ? "all" : l === "all" ? "one" : "off")),
    []
  );

  const handleEnded = () => {
    const { loop, order, orderIndex } = stateRef.current;
    if (loop === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }
    if (orderIndex + 1 < order.length) {
      playAt(orderIndex + 1);
      return;
    }
    // loop "all" wraps back to the start of the order
    if (loop === "all" && order.length > 0) {
      playAt(0);
      return;
    }
    // no loop, end of list → stop cleanly, no auto-restart
    setIsPlaying(false);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        play,
        playQueue,
        toggle,
        seek,
        stop,
        next,
        prev,
        shuffle,
        loop,
        toggleShuffle,
        toggleLoop,
        playerState,
        bufferedRatio,
      }}
    >
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={handleEnded}
      />
      {children}
    </AudioPlayerContext.Provider>
  );
}

export const useAudioPlayer = () => useContext(AudioPlayerContext);
