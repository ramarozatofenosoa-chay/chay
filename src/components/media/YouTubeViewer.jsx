import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, StickyNote, Printer } from "lucide-react";
import { useBackHandler } from "@/hooks/useBackHandler";

export default function YouTubeViewer({ video, open, onClose }) {
  const [expanded, setExpanded] = useState(false);

  // Le bouton retour du téléphone ferme la vidéo au lieu de naviguer.
  useBackHandler(Boolean(open && video), onClose);

  React.useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

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
            className={`relative ${expanded ? "fixed inset-0 grid place-items-center bg-black" : "w-[92vw] max-w-3xl"}`}
          >
            <div className={expanded ? "w-full h-full grid place-items-center" : ""}>
              <div className={`relative bg-black overflow-hidden ${expanded ? "w-full h-full" : "rounded-2xl"}`}>
                <div className={expanded ? "w-full h-full" : "aspect-video"}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Toolbar */}
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    title={expanded ? "Réduire" : "Plein écran (fond noir)"}
                  >
                    {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={onClose}
                    className="h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {video.verse_note && !expanded && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <div className="flex items-start gap-2 text-white">
                      <StickyNote className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-sm whitespace-pre-line line-clamp-4 flex-1">{video.verse_note}</p>
                      <button
                        onClick={() => printNote(video.title, video.verse_note)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold hover:bg-white/25"
                      >
                        <Printer className="h-3.5 w-3.5" /> Imprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!expanded && (
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

function printNote(title, note) {
  const w = window.open("", "_blank", "width=600,height=700");
  if (!w) return;
  w.document.write(
    "<html><head><title></title><style>body{font-family:Georgia,serif;padding:40px;color:#1a1a1a;line-height:1.7}h1{font-size:20px;margin-bottom:8px}.ref{color:#888;font-size:12px;margin-bottom:24px}pre{white-space:pre-wrap;font-family:inherit;font-size:15px}</style></head><body><h1 id='t'></h1><div class='ref'>CHAY — Note de versets</div><pre id='n'></pre></body></html>"
  );
  w.document.getElementById("t").textContent = title;
  w.document.getElementById("n").textContent = note;
  w.document.close();
  w.focus();
  w.print();
}