import React, { createContext, useContext, useRef, useState, useEffect } from "react";

const AudioPlayerContext = createContext();

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audio_url;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [currentTrack]);

  const play = (track) => {
    if (!track?.audio_url) return;
    if (currentTrack?.id === track.id) {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      setCurrentTrack(track);
    }
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seek = (t) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <AudioPlayerContext.Provider
      value={{ currentTrack, isPlaying, currentTime, duration, play, toggle, seek, stop }}
    >
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setIsPlaying(false)}
      />
      {children}
    </AudioPlayerContext.Provider>
  );
}

export const useAudioPlayer = () => useContext(AudioPlayerContext);