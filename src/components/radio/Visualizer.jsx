import React, { useEffect, useState } from "react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

export default function Visualizer({ active, loading, bars = 6, className = "" }) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return active ? (
      <span className="text-[0.7rem] font-bold tracking-wide text-red-500">
        EN DIRECT
      </span>
    ) : null;
  }

  return (
    <div className={`flex items-end gap-1 ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-current"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            transform: active ? undefined : "scaleY(0.16)",
            animation: active
              ? `radio-bar ${loading ? 1.6 : 0.55 + (i % 4) * 0.22}s ease-in-out ${
                  i * 0.1
                }s infinite`
              : "none",
          }}
        />
      ))}
    </div>
  );
}