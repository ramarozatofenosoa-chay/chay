import React, { useEffect, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { subscribeMediaControl } from "@/lib/mediaControl";

export default function GlobalMediaControl() {
  const [control, setControl] = useState(null);

  useEffect(() => subscribeMediaControl(setControl), []);

  if (!control) return null;
  const isRadio = control.type === "radio";
  const ActionIcon = isRadio ? Square : control.isPlaying ? Pause : Play;
  const actionLabel = isRadio ? "Arrêter la radio" : control.isPlaying ? "Mettre en pause" : "Reprendre la lecture";

  return (
    <div className="fixed bottom-36 md:bottom-20 inset-x-0 z-[70] px-3 pointer-events-none">
      <div className="mx-auto max-w-3xl flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-xl pointer-events-auto">
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-foreground/50">
            {isRadio ? "Radio en direct" : "Lecture en cours"}
          </p>
          <p className="truncate text-sm font-semibold">{control.title}</p>
        </div>
        <button
          type="button"
          onClick={isRadio ? control.stop : control.toggle}
          aria-label={actionLabel}
          title={actionLabel}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <ActionIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
