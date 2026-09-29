import { useEffect, useRef } from "react";
import { syncMediaSessionActions } from "@/lib/mediaSession";
import {
  clearAndroidMediaNotification,
  isAndroidApp,
  requestAndroidMediaNotificationPermission,
  subscribeAndroidMediaActions,
  updateAndroidMediaNotification,
} from "@/lib/androidMediaNotification";
import {
  createMediaNotificationState,
  dispatchMediaNotificationAction,
} from "@/lib/mediaNotificationState";

/**
 * Synchronise le média actif avec les contrôles système Android/iOS.
 */
export function useMediaSessionSync(control) {
  const controlRef = useRef(control);
  const permissionRequestedRef = useRef(false);
  controlRef.current = control;

  useEffect(() => {
    if (isAndroidApp()) return;
    if (typeof navigator === "undefined" || !navigator.mediaSession) return;
    const session = navigator.mediaSession;
    if (!control) {
      session.metadata = null;
      session.playbackState = "none";
      try { session.setPositionState(); } catch {}
      return;
    }

    if (typeof window.MediaMetadata === "function") {
      try {
        session.metadata = new window.MediaMetadata({
          title: control.title || "Média",
          artist: control.subtitle || "CHAY",
          album: control.isLive ? "En direct" : "ÉGLISE CHAY",
          artwork: control.artwork ? [{ src: control.artwork, sizes: "512x512" }] : [],
        });
      } catch (error) {
        console.warn("[MediaSession] Unable to update media metadata.", error);
      }
    }
    session.playbackState = control.isPlaying ? "playing" : "paused";
    try {
      if (control.duration > 0 && Number.isFinite(control.duration)) {
        session.setPositionState({
          duration: control.duration,
          playbackRate: 1,
          position: Math.max(0, Math.min(control.currentTime || 0, control.duration)),
        });
      } else {
        session.setPositionState();
      }
    } catch {
      // Live streams and some embedded players do not expose a seekable timeline.
    }
  }, [
    control?.id,
    control?.title,
    control?.subtitle,
    control?.artwork,
    control?.isLive,
    control?.isPlaying,
    control?.currentTime,
    control?.duration,
  ]);

  useEffect(() => {
    if (!isAndroidApp()) return undefined;
    let handle;
    subscribeAndroidMediaActions(({ action, position }) => {
      dispatchMediaNotificationAction(controlRef.current, action, { position });
    }).then((subscription) => {
      handle = subscription;
    }).catch((error) => {
      console.error("[MediaNotification] Unable to subscribe to native media actions.", error);
    });
    return () => handle?.remove();
  }, []);

  useEffect(() => {
    if (!isAndroidApp()) return;
    if (!control) {
      clearAndroidMediaNotification().catch((error) => {
        console.error("[MediaNotification] Unable to clear native media notification.", error);
      });
      return;
    }

    const media = createMediaNotificationState(control);
    const update = () => updateAndroidMediaNotification(media).catch((error) => {
      console.error("[MediaNotification] Unable to update native media notification.", error);
    });
    if (!permissionRequestedRef.current) {
      permissionRequestedRef.current = true;
      requestAndroidMediaNotificationPermission()
        .catch((error) => {
          console.warn("[MediaNotification] Notification permission request failed.", error);
        })
        .finally(() => {
          const current = controlRef.current;
          if (current) {
            updateAndroidMediaNotification(createMediaNotificationState(current)).catch((error) => {
              console.error("[MediaNotification] Unable to update native media notification.", error);
            });
          }
        });
      return;
    }
    update();
  }, [
    control?.id,
    control?.title,
    control?.subtitle,
    control?.artwork,
    control?.isPlaying,
    control?.isLive,
    control?.currentTime,
    control?.duration,
    Boolean(control?.previous),
    Boolean(control?.next),
  ]);

  useEffect(() => {
    if (isAndroidApp()) return;
    if (typeof navigator === "undefined" || !navigator.mediaSession) return;
    syncMediaSessionActions(navigator.mediaSession, controlRef);
  }, [
    control?.id,
    Boolean(control?.previous),
    Boolean(control?.next),
    Boolean(control?.seek),
    control?.duration,
  ]);
}
