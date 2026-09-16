import React, { useCallback, useRef } from "react";

export function formatTime(t) {
  if (!t || !isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.round(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SeekBar({ currentTime, duration, onSeek }) {
  const barRef = useRef(null);
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const seekFromEvent = useCallback(
    (clientX) => {
      const el = barRef.current;
      if (!el || !duration) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    seekFromEvent(e.clientX);
  };
  const onPointerMove = (e) => {
    if (e.buttons !== 1) return;
    seekFromEvent(e.clientX);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] tabular-nums text-foreground/55 w-8 text-right">
        {formatTime(currentTime)}
      </span>
      <div
        ref={barRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        className="relative flex-1 h-5 flex items-center cursor-pointer touch-none"
      >
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div
          className="absolute h-3.5 w-3.5 rounded-full bg-primary shadow -translate-x-1/2 pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-foreground/55 w-8">
        {formatTime(duration)}
      </span>
    </div>
  );
}