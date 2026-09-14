import React, { useState } from "react";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const COLORS = [
  "#FF4D2D",
  "#FF57B2",
  "#8A56E2",
  "#4A6CFE",
  "#2E6F40",
  "#F4C430",
  "#FF8C00",
  "#F8C8DC",
  "#ffffff",
];

const PAGES = [
  {
    name: "Le jardin",
    regions: [
      { id: "sky", el: <rect x="0" y="0" width="400" height="270" rx="16" /> },
      { id: "ground", el: <rect x="0" y="270" width="400" height="130" /> },
      { id: "sun", el: <circle cx="64" cy="64" r="36" /> },
      { id: "cloud", el: <ellipse cx="310" cy="70" rx="54" ry="28" /> },
      { id: "leaves", el: <circle cx="263" cy="200" r="52" /> },
      { id: "trunk", el: <rect x="252" y="210" width="22" height="80" rx="4" /> },
      { id: "roof", el: <polygon points="68,240 126,182 184,240" /> },
      { id: "house", el: <rect x="80" y="240" width="92" height="80" rx="4" /> },
      { id: "window", el: <rect x="90" y="258" width="22" height="22" rx="2" /> },
      { id: "door", el: <rect x="110" y="280" width="28" height="40" rx="3" /> },
    ],
  },
  {
    name: "L'étoile",
    regions: [
      { id: "sky2", el: <rect x="0" y="0" width="400" height="400" rx="16" /> },
      {
        id: "star",
        el: (
          <polygon points="200,70 218,128 278,128 230,162 248,220 200,186 152,220 170,162 122,128 182,128" />
        ),
      },
      { id: "moon", el: <circle cx="70" cy="300" r="40" /> },
      { id: "s1", el: <circle cx="320" cy="80" r="8" /> },
      { id: "s2", el: <circle cx="350" cy="140" r="6" /> },
      { id: "s3", el: <circle cx="300" cy="200" r="7" /> },
    ],
  },
];

export default function ColoringBook() {
  const [page, setPage] = useState(0);
  const [colors, setColors] = useState({});
  const [active, setActive] = useState(COLORS[0]);

  const fill = (id) => setColors((c) => ({ ...c, [id]: active }));
  const clear = () => setColors({});
  const current = PAGES[page];

  const go = (dir) => {
    setPage((p) => Math.max(0, Math.min(PAGES.length - 1, p + dir)));
    setColors({});
  };

  return (
    <div className="rounded-[2rem] border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-extrabold text-lg">{current.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => go(-1)}
            disabled={page === 0}
            className="h-9 w-9 grid place-items-center rounded-full border border-border disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            disabled={page === PAGES.length - 1}
            className="h-9 w-9 grid place-items-center rounded-full border border-border disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 400 400"
        className="w-full rounded-2xl border border-border bg-white"
        style={{ touchAction: "manipulation" }}
      >
        {current.regions.map((r) =>
          React.cloneElement(r.el, {
            key: r.id,
            fill: colors[r.id] || "#ffffff",
            stroke: "#374151",
            strokeWidth: 2,
            onClick: () => fill(r.id),
            style: { cursor: "pointer" },
          })
        )}
      </svg>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`h-9 w-9 rounded-full border-2 transition ${
              active === c
                ? "border-foreground scale-110"
                : "border-border"
            }`}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
        <button
          onClick={clear}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted"
        >
          <Trash2 className="h-3.5 w-3.5" /> Effacer
        </button>
      </div>
    </div>
  );
}