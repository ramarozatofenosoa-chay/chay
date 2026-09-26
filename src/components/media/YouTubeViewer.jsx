import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import { useBackHandler } from "@/hooks/useBackHandler";

// Charge l'API YouTube IFrame si pas encore chargée
function loadYTScript() {
  if (window.YT) return;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
}

export default function YouTubeViewer({
  video,
  videos = [],
  currentIndex = 0,
  open,
  onClose,
  onEnded,
}) {
  const [controls, setControls] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const hideTimerRef = useRef(null);

  useBackHandler(Boolean(open && video), onClose);

  // Charge l'API YouTube quand le viewer s'ouvre
  useEffect(() => {
    if (!open) return;
    loadYTScript();
  }, [open]);

  // Cache les contrôles après inactivité
  useEffect(() => {
    if (!open) return;
    const reset = () => {
      setControls(true);
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setControls(false), 3000);
    };
    reset();
    window.addEventListener("mousemove", reset);
    window.addEventListener("touchstart", reset);
    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("touchstart", reset);
      clearTimeout(hideTimerRef.current);
    };
  }, [open]);

  // Effacer le plein écran quand on ferme
  useEffect(() => {
    if (!open && fullscreen) {
      (document.fullscreenElement || document.webkitFullscreenElement)?.exitFullscreen?.();
      setFullscreen(false);
    }
  }, [open, fullscreen]);

  // Quand la vidéo change, reset le contrôle
  useEffect(() => {
    setControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControls(false), 3000);
  }, [video?.id]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen?.();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {}
  };

  // Appeler le callback quand la vidéo se termine
  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current || !window.YT) return;
    try {
      new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded?.();
            }
          },
        },
      });
    } catch {}
  }, [onEnded]);

  const goToNext = useCallback(() => {
    if (videos.length > 0 && currentIndex < videos.length - 1) {
      onEnded?.();
    }
  }, [videos, currentIndex, onEnded]);

  const isLast = currentIndex >= videos.length - 1;

  return (
    <AnimatePresence>
      {open && video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            ref={containerRef}
            className={`relative ${fullscreen ? "fixed inset-0 grid place-items-center bg-black" : "w-[92vw] max-w-3xl"}`}
          >
            <div className={fullscreen ? "w-full h-full grid place-items-center" : ""}>
              <div className={`relative bg-black overflow-hidden ${fullscreen ? "w-full h-full" : "rounded-2xl"}`}>
                <div className={fullscreen ? "w-full h-full" : "aspect-video"}>
                  <iframe
                    ref={iframeRef}
                    src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1&rel=0&enablejsapi=1`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                  />
                </div>
              </div>

              {/* Contrôles bas — cachés par défaut, affichés au survol/touch */}
              <div
                className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${controls ? "opacity-100" : "opacity-0"}`}
                style={{ pointerEvents: controls ? "auto" : "none" }}
              >
                <div className="bg-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
                  <span className="text-white text-sm font-bold truncate max-w-[60%]">
                    {video.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {!isLast && (
                      <button
                        onClick={goToNext}
                        className="h-8 w-8 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 text-xs font-bold"
                        title="Vidéo suivante"
                      >
                        ▶
                      </button>
                    )}
                    <button
                      onClick={toggleFullscreen}
                      className="h-8 w-8 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
                      title={fullscreen ? "Quitter plein écran" : "Plein écran"}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={onClose}
                      className="h-8 w-8 grid place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {!fullscreen && !controls && (
                <div className="bg-card px-4 py-3 rounded-b-2xl -mt-1">
                  <h3 className="font-bold line-clamp-1">{video.title}</h3>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
