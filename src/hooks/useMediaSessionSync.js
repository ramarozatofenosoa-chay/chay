import { useEffect, useRef } from "react";
import { useEffect } from "react";

/**
 * Synchronise l'état de lecture avec l'API MediaSession d'Android/iOS.
 * Utilise des refs pour éviter les problèmes de closure stale.
 */
export function useMediaSessionSync({ 
  isPlaying, 
  currentTrack, 
  onPlayPause, 
  onNext, 
  onPrev,
  onStop 
}) {
  // On garde les callbacks dans des refs pour qu'ils soient toujours frais
  const callbacksRef = useRef({ onPlayPause, onNext, onPrev, onStop });
  
  useEffect(() => {
    callbacksRef.current = { onPlayPause, onNext, onPrev, onStop };
  }, [onPlayPause, onNext, onPrev, onStop]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    // 1. METTRE À JOUR LES MÉTADONNÉES (Titre, Artiste, Image)
    if (currentTrack) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: currentTrack.title || "Musique",
          artist: currentTrack.artist || currentTrack.speaker || "CHAY",
          album: "Playlist CHAY",
          artwork: [
            { src: currentTrack.cover_url || "/logo.png", sizes: "512x512", type: "image/png" }
          ],
        });
      } catch (e) {
        console.warn("MediaMetadata error:", e);
      }
    } else {
      navigator.mediaSession.metadata = null;
    }

    // 2. DÉFINIR L'ÉTAT DE PLAYBACK
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    // 3. CONNECTER LES BOUTONS PHYSIQUES/SYSTÈME
    // On utilise des wrappers qui appellent la ref fraîche
    
    const safeCall = (fnName) => (...args) => {
      const fn = callbacksRef.current[fnName];
      if (fn) fn(...args);
    };

    navigator.mediaSession.setActionHandler("play", () => safeCall("onPlayPause")());
    navigator.mediaSession.setActionHandler("pause", () => safeCall("onPlayPause")());
    navigator.mediaSession.setActionHandler("previoustrack", () => safeCall("onPrev")());
    navigator.mediaSession.setActionHandler("nexttrack", () => safeCall("onNext")());
    navigator.mediaSession.setActionHandler("stop", () => safeCall("onStop")());

    // Nettoyage optionnel si besoin, mais généralement inutile tant que l'app tourne
    return () => {
       // Optionnel : reset handlers
    };

  }, [isPlaying, currentTrack]); // Se déclenche quand l'état change
  
  // Import nécessaire pour useRef
}
// Note : Il faut importer useRef en haut du fichier
