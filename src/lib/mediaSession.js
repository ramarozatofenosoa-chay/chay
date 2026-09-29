const ACTIONS = [
  "play",
  "pause",
  "stop",
  "previoustrack",
  "nexttrack",
  "seekto",
  "seekbackward",
  "seekforward",
];

export function syncMediaSessionActions(session, controlRef) {
  const control = controlRef.current;
  const set = (action, handler) => {
    try {
      session.setActionHandler(action, handler);
    } catch {
      // Browser support for individual Media Session actions varies.
    }
  };

  set("play", control ? () => {
    const active = controlRef.current;
    if (active?.type === "radio") active.play?.();
    else if (active && !active.isPlaying) (active.play || active.toggle)?.();
  } : null);
  set("pause", control ? () => {
    const active = controlRef.current;
    if (active?.type === "radio") active.stop?.();
    else if (active?.isPlaying) (active.pause || active.toggle)?.();
  } : null);
  set("stop", control ? () => {
    const active = controlRef.current;
    (active?.stop || active?.pause)?.();
  } : null);
  set("previoustrack", control?.previous
    ? () => controlRef.current?.previous?.()
    : null);
  set("nexttrack", control?.next
    ? () => controlRef.current?.next?.()
    : null);
  set("seekto", control?.seek && control.duration > 0
    ? (details) => controlRef.current?.seek?.(details.seekTime)
    : null);
  set("seekbackward", control?.seek && control.duration > 0
    ? (details) => {
        const active = controlRef.current;
        const offset = Number(details.seekOffset) || 10;
        active?.seek?.(Math.max(0, (active.currentTime || 0) - offset));
      }
    : null);
  set("seekforward", control?.seek && control.duration > 0
    ? (details) => {
        const active = controlRef.current;
        const offset = Number(details.seekOffset) || 10;
        active?.seek?.(Math.min(active.duration, (active.currentTime || 0) + offset));
      }
    : null);

  return ACTIONS;
}
