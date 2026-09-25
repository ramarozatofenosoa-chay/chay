import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, ArrowRight, Share2, Pencil, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const todayISO = () => new Date().toISOString().split("T")[0];

// Verset du jour : affiche le dévotional du jour (carte dégradée) et permet
// à un administrateur de l'ajouter/modifier directement (bouton "Ajouter"),
// sur le même principe que la Question Logique.
export default function VersetDuJourSection({ refreshKey = 0 }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [devotional, setDevotional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    scripture_reference: "",
    verse_text: "",
    reading_date: todayISO(),
  });

  const load = async () => {
    try {
      const today = todayISO();
      const [todayDevs, allDevs] = await Promise.all([
        base44.entities.Devotional
          .filter({ reading_date: today }, "-reading_date", 1)
          .catch(() => []),
        base44.entities.Devotional.list("-reading_date", 1).catch(() => []),
      ]);
      const todayDev =
        Array.isArray(todayDevs) && todayDevs.length ? todayDevs[0] : null;
      const fallback = Array.isArray(allDevs) ? allDevs[0] : null;
      setDevotional(todayDev || fallback || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const openEdit = () => {
    setDraft({
      scripture_reference: devotional?.scripture_reference || "",
      verse_text: devotional?.verse_text || devotional?.title || "",
      reading_date: devotional?.reading_date || todayISO(),
    });
    setEditing(true);
  };

  const save = async () => {
    const ref = draft.scripture_reference.trim();
    const verse = draft.verse_text.trim();
    if (!ref || !verse) {
      toast({ title: "Référence et verset requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: ref,
        scripture_reference: ref,
        verse_text: verse,
        content: verse,
        reading_date: draft.reading_date || todayISO(),
        language: "fr",
      };
      if (devotional) {
        await base44.entities.Devotional.update(devotional.id, payload);
      } else {
        await base44.entities.Devotional.create(payload);
      }
      toast({ title: "Verset du jour publié" });
      setEditing(false);
      await load();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const shareVerse = async () => {
    const url = window.location.origin;
    let text;
    if (devotional) {
      const ref = devotional.scripture_reference || "";
      const colon = ref.lastIndexOf(":");
      const verseNum = colon >= 0 ? ref.slice(colon + 1).trim() : "";
      const verseText = devotional.verse_text || devotional.title || "";
      text = `${ref} LSG\n${verseNum ? `[${verseNum}] ` : ""}${verseText}\n${url}`;
    } else {
      text = `Philippiens 4:13 LSG\n[13] Je puis tout par celui qui me fortifie.\n${url}`;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: "Verset du jour", text });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Verset copié" });
      } catch {
        /* ignore */
      }
    }
  };

  const chapterLink = devotional?.scripture_reference
    ? `/bible?ref=${encodeURIComponent(devotional.scripture_reference)}&translation=fra_lsg`
    : "/bible";

  return (
    <section className="mt-6">
      {/* Format ramené à celui du widget Préc./Nouv. juste en dessous : mêmes
          retraits (1,5–1,5), texte réduit, bouton discret — la carte ne doit
          plus écraser le reste de l'accueil. */}
      <div className="rounded-[1.5rem] brand-gradient p-4 md:p-6 text-white relative overflow-hidden glow-primary">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <BookOpen className="h-3.5 w-3.5" /> Verset du jour
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !editing && (
                <button
                  onClick={openEdit}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-bold transition"
                >
                  <Pencil className="h-3.5 w-3.5" /> {devotional ? "Modifier" : "Ajouter"}
                </button>
              )}
              <button
                onClick={shareVerse}
                className="h-7 w-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition"
                aria-label="Partager le verset"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="mt-4 space-y-2">
              <div className="h-5 w-3/4 bg-white/20 rounded animate-pulse" />
              <div className="h-5 w-2/3 bg-white/20 rounded animate-pulse" />
            </div>
          ) : devotional ? (
            <>
              <p className="selectable mt-3 text-sm md:text-base font-light leading-snug [font-family:'Montserrat',sans-serif]">
                « {devotional.verse_text || devotional.title} »
              </p>
              <p className="mt-1.5 text-xs font-medium text-white/75 [font-family:'Montserrat',sans-serif]">
                — {devotional.scripture_reference}
              </p>
              <Link
                to={chapterLink}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white text-neutral-900 px-4 py-2 text-xs font-bold hover:scale-105 transition"
              >
                Lire le chapitre <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <p className="selectable mt-3 text-sm md:text-base font-light leading-snug [font-family:'Montserrat',sans-serif]">
              « Je puis tout par celui qui me fortifie. » — Philippiens 4:13
            </p>
          )}
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verset du jour</DialogTitle>
            <DialogDescription>
              Renseignez la référence et le texte du verset affiché sur l'accueil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vd-ref">Référence</Label>
              <Input
                id="vd-ref"
                value={draft.scripture_reference}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, scripture_reference: e.target.value }))
                }
                placeholder="Philippiens 4:13"
                className="selectable"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vd-verse">Texte du verset</Label>
              <Textarea
                id="vd-verse"
                value={draft.verse_text}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, verse_text: e.target.value }))
                }
                rows={4}
                placeholder="Je puis tout par celui qui me fortifie."
                className="selectable"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vd-date">Date de lecture</Label>
              <Input
                id="vd-date"
                type="date"
                value={draft.reading_date}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, reading_date: e.target.value }))
                }
                className="selectable"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1.5" /> Annuler
            </Button>
            <Button onClick={save} disabled={saving}>
              <Check className="h-4 w-4 mr-1.5" /> {saving ? "Publication…" : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}