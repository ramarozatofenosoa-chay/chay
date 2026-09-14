import React, { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const THRESHOLD = 70;
const MAX = 110;

/**
 * Reusable pull-to-refresh.
 * mode="window" (default): attaches to the page scroll, no layout change —
 *   renders a fixed top spinner overlay; pull when the page is at the top.
 * mode="container": becomes a bounded scroll area wrapping its children.
 */
export default function PullToRefresh({ onRefresh, children, className, mode = "window" }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const scrollEl = useRef(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);
  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    const target = mode === "window" ? window : scrollEl.current;
    if (!target) return;
    const top = () =>
      mode === "window"
        ? window.scrollY || document.documentElement.scrollTop
        : scrollEl.current?.scrollTop || 0;
    const onStart = (e) => {
      if (refreshingRef.current) return;
      startY.current = top() <= 0 ? e.touches[0].clientY : null;
    };
    const onMove = (e) => {
      if (startY.current === null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        const next = Math.min(dy * 0.5, MAX);
        pullRef.current = next;
        setPull(next);
      }
    };
    const onEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await onRefreshRef.current?.();
        } finally {
          setRefreshing(false);
          setPull(0);
          pullRef.current = 0;
        }
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    };
    target.addEventListener("touchstart", onStart, { passive: true });
    target.addEventListener("touchmove", onMove, { passive: true });
    target.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      target.removeEventListener("touchstart", onStart);
      target.removeEventListener("touchmove", onMove);
      target.removeEventListener("touchend", onEnd);
    };
  }, [mode]);

  const spinner = refreshing ? (
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  ) : pull > 8 ? (
    <RefreshCw
      className="h-5 w-5 text-primary"
      style={{ transform: `rotate(${pull * 3}deg)`, opacity: Math.min(pull / THRESHOLD, 1) }}
    />
  ) : null;

  if (mode === "window") {
    return (
      <>
        <div
          className="fixed top-0 inset-x-0 z-50 flex items-center justify-center pointer-events-none transition-opacity"
          style={{ height: pull, opacity: pull > 0 || refreshing ? 1 : 0 }}
        >
          <div className="rounded-full bg-background shadow-lg border border-border p-2">{spinner}</div>
        </div>
        {children}
      </>
    );
  }

  return (
    <div ref={scrollEl} className={`overflow-y-auto ${className || ""}`}>
      <div className="flex items-center justify-center overflow-hidden" style={{ height: pull }}>
        {spinner}
      </div>
      {children}
    </div>
  );
}