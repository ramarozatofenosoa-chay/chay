import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useMediaPlayerState } from "@/hooks/useMediaPlayerState";
import { registerMediaControl } from "@/lib/mediaControl";

// Lecteur vidéo (Films) — réutilise le même hook que la radio, la musique et
// les prédications. Superpose un spinner de tamponnage cohérent.
export default function VideoPlayer({ src, poster, title = "Film", className = "" }) {
  const ref = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { state } = useMediaPlayerState(ref, { isLive: false });
  const buffering = state === "connecting" || state === "buffering";

  useEffect(() => {
    if (!hasStarted) return undefined;
    const video = ref.current;
    return registerMediaControl({
      type: "video",
      title,
      isPlaying,
      toggle: () => {
        if (!video) return;
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      },
      stop: () => {
        video?.pause();
        setHasStarted(false);
      },
    });
  }, [hasStarted, isPlaying, title]);

  return (
    <div className={`relative bg-black ${className}`}>
      <video
        ref={ref}
        src={src}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        poster={poster}
        preload="auto"
        className="w-full h-full"
        onPlay={() => { setHasStarted(true); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setHasStarted(false); }}
      />
      {buffering && (
        <div className="absolute inset-0 grid place-items-center bg-black/30 pointer-events-none">
          <Loader2 className="h-9 w-9 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}