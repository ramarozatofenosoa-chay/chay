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
  verses,
  annotations,
  onHighlight,
  onNote,
  onRemove,
}) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const count = verses.length;
  const colors = verses.map((v) => annotations[v.number]?.highlight_color);
  const commonColor =
    count && colors.every((c) => c === colors[0]) ? colors[0] : null;

  useEffect(() => {
    setNote(count === 1 ? annotations[verses[0]?.number]?.note || "" : "");
  }, [open, count]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        verses.map((v) => `${v.number}. ${v.text}`).join("\n")
      );
      toast({ title: `${count} verset(s) copié(s)` });
    } catch {
      toast({ title: "Copie impossible" });
    }
  };

  const title =
    count > 1 ? `${count} versets sélectionnés` : `Verset ${verses[0]?.number}`;
  const desc = verses.map((v) => `${v.number} ${v.text}`).join("  ");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" /> {title}
          </DrawerTitle>
          <DrawerDescription className="leading-relaxed text-foreground/70 max-h-32 overflow-y-auto">
            {desc}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-5">
          <div>
            <div className="text-sm font-bold mb-2">Surligner</div>
            <div className="flex gap-3">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onHighlight(c.id)}
                  className={`h-10 w-10 rounded-full ${c.swatch} transition ${
                    commonColor === c.id
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-110"
                  }`}
                  aria-label={c.id}
                />
              ))}
            </div>
            {commonColor && (
              <button
                onClick={onRemove}
                className="mt-3 text-sm font-semibold text-foreground/60 hover:text-destructive inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Retirer le surlignage
              </button>
            )}
          </div>

          <div>
            <div className="text-sm font-bold mb-2 flex items-center gap-1.5">
              <StickyNote className="h-4 w-4" />{" "}
              {count > 1 ? "Note pour tous les versets" : "Note personnelle"}
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
              Enregistrer
            </button>
          </div>

          <button
            onClick={copy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-bold hover:bg-muted transition"
          >
            <Copy className="h-4 w-4" /> Copier{" "}
            {count > 1 ? `les ${count} versets` : "le verset"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}