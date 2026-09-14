import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Copy, Trash2, StickyNote } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HIGHLIGHT_COLORS } from "@/lib/bibleConstants";

export default function VerseActionsSheet({
  open,
  onOpenChange,
  verse,
  annotation,
  onHighlight,
  onNote,
  onRemove,
}) {
  const { toast } = useToast();
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(annotation?.note || "");
  }, [annotation, open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(verse?.text || "");
      toast({ title: "Verset copié" });
    } catch {
      toast({ title: "Copie impossible" });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" /> Verset {verse?.number}
          </DrawerTitle>
          <DrawerDescription className="leading-relaxed text-foreground/70">
            {verse?.text}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-5">
          {/* Highlight */}
          <div>
            <div className="text-sm font-bold mb-2">Surligner</div>
            <div className="flex gap-3">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onHighlight(c.id)}
                  className={`h-10 w-10 rounded-full ${c.swatch} transition ${
                    annotation?.highlight_color === c.id
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-110"
                  }`}
                  aria-label={c.id}
                />
              ))}
            </div>
            {annotation?.highlight_color && (
              <button
                onClick={onRemove}
                className="mt-3 text-sm font-semibold text-foreground/60 hover:text-destructive inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Retirer le surlignage
              </button>
            )}
          </div>

          {/* Note */}
          <div>
            <div className="text-sm font-bold mb-2 flex items-center gap-1.5">
              <StickyNote className="h-4 w-4" /> Note personnelle
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Votre note…"
              className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary resize-none"
            />
            <button
              onClick={() => onNote(note)}
              className="mt-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold"
            >
              Enregistrer la note
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={copy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-bold hover:bg-muted transition"
          >
            <Copy className="h-4 w-4" /> Copier le verset
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}