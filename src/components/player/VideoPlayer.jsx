import React, { useRef } from "react";
import { Loader2 } from "lucide-react";
import { useMediaPlayerState } from "@/hooks/useMediaPlayerState";

// Lecteur vidéo (Films) — réutilise le même hook que la radio, la musique et
// les prédications. Superpose un spinner de tamponnage cohérent.
export default function VideoPlayer({ src, poster, className = "" }) {
  const ref = useRef(null);
  const { state } = useMediaPlayerState(ref, { isLive: false });
  const buffering = state === "connecting" || state === "buffering";

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
      />
      {buffering && (
        <div className="absolute inset-0 grid place-items-center bg-black/30 pointer-events-none">
          <Loader2 className="h-9 w-9 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}