import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, ArrowRight, Share2, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
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
import {
  toISODate,
  addDaysISO,
  formatISODate,
  isISODate,
} from "@/lib/localDate";

// Fenêtre de programmation affichée dans la boîte de dialogue.
const PLANNING_DAYS = 30;

// Verset du jour : affiche le dévotional du jour (carte dégradée) et permet
// à un administrateur de le programmer à l'avance (jusqu'à 30 jours via la
// liste, au-delà via le champ date). L'affichage est automatique : le jour
// J, c'est l'entrée datée de J qui apparaît, sans intervention.
export default function VersetDuJourSection({ refreshKey = 0 }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [devotional, setDevotional] = useState(null); // verset affiché
  const [todayDev, setTodayDev] = useState(null); // verset daté d'aujourd'hui
  const [all, setAll] = useState([]); // entrées récentes, pour le planning
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    scripture_reference: "",
    verse_text: "",
    reading_date: toISODate(),
  });

  const load = async () => {
    try {
      const today = toISODate();
      const [todayDevs, recent] = await Promise.all([
        base44.entities.Devotional
          .filter({ reading_date: today }, "-reading_date", 1)
          .catch(() => []),
        base44.entities.Devotional.list("-reading_date", 100).catch(() => []),
      ]);
      const list = Array.isArray(recent) ? recent : [];
      const current =
        Array.isArray(todayDevs) && todayDevs[0] ? todayDevs[0] : null;
      // Repli : le dernier verset antérieur à aujourd'hui, en excluant
      // explicitement les dates futures. C'était le bug : on prenait le
      // dernier dévotional créé, donc un verset programmé pour plus tard
      // s'affichait immédiatement.
      const past =
        list.find((d) => isISODate(d.reading_date) && d.reading_date < today) ||
        null;
      setAll(list);
      setTodayDev(current);
      setDevotional(current || past || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const openEdit = () => {
    // On repart du verset affiché mais on cible AUJOURD'HUI : publier comble
    // le trou du jour plutôt que de retoucher un verset déjà passé.
    const base = todayDev || devotional;
    setDraft({
      scripture_reference: base?.scripture_reference || "",
      verse_text: base?.verse_text || base?.title || "",
      reading_date: toISODate(),
    });
    setEditing(true);
  };

  // Clic sur une ligne du planning : charge ce jour dans le formulaire.
  const editOn = (day, entry) => {
    setDraft({
      scripture_reference: entry?.scripture_reference || "",
      verse_text: entry?.verse_text || entry?.title || "",
      reading_date: day,
    });
  };

  const save = async () => {
    const ref = draft.scripture_reference.trim();
    const verse = draft.verse_text.trim();
    const day = draft.reading_date;
    if (!ref || !verse) {
      toast({ title: "Référence et verset requis", variant: "destructive" });
      return;
    }
    if (!isISODate(day)) {
      toast({ title: "Date invalide", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: ref,
        scripture_reference: ref,
        verse_text: verse,
        content: verse,
        reading_date: day,
        language: "fr",
      };
      // Une seule entrée par date : si ce jour est déjà programmé, on met à
      // jour au lieu de créer un doublon affiché deux fois.
      const existing =
        all.find((d) => d.reading_date === day) ||
        (devotional && devotional.reading_date === day ? devotional : null);
      if (existing) {
        await base44.entities.Devotional.update(existing.id, payload);
      } else {
        await base44.entities.Devotional.create(payload);
      }
      toast({
        title: "Verset publié",
        description: `Affichage le ${formatISODate(day, { long: true })}`,
      });
      setEditing(false);
      await load();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeOn = async (entry) => {
    const when = formatISODate(entry.reading_date, { long: true });
    if (!window.confirm(`Supprimer le verset du ${when} ?`)) return;
    try {
      await base44.entities.Devotional.delete(entry.id);
      toast({ title: "Verset supprimé", description: when });
      await load();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
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

  // ── Données du planning (30 prochains jours) ──────────────────────────
  const today = toISODate();
  const byDate = {};
  for (const d of all) {
    if (isISODate(d.reading_date) && !byDate[d.reading_date]) {
      byDate[d.reading_date] = d;
    }
  }
  const days = Array.from({ length: PLANNING_DAYS }, (_, k) =>
    addDaysISO(today, k)
  );
  const filledCount = days.filter((d) => byDate[d]).length;

  const dateHint = !isISODate(draft.reading_date)
    ? "Choisissez une date d'affichage."
    : draft.reading_date < today
      ? "Date passée : ce verset ne s'affichera plus automatiquement."
      : draft.reading_date === today
        ? "S'affiche aujourd'hui."
        : `S'affichera automatiquement le ${formatISODate(draft.reading_date, { long: true })}.`;

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
              {/* Rappel admin : la carte montre un verset antérieur faute
                  d'entrée pour aujourd'hui. */}
              {isAdmin && !todayDev && isISODate(devotional.reading_date) && (
                <p className="mt-1 text-xs text-white/70 [font-family:'Montserrat',sans-serif]">
                  Aucun verset programmé pour aujourd'hui — dernier publié le{" "}
                  {formatISODate(devotional.reading_date, { long: true })}.
                </p>
              )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programmer le verset du jour</DialogTitle>
            <DialogDescription>
              Choisissez la date d'affichage : le verset apparaît seul sur
              l'accueil le jour choisi, sans autre action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vd-date">Date d'affichage</Label>
              <Input
                id="vd-date"
                type="date"
                value={draft.reading_date}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, reading_date: e.target.value }))
                }
                className="selectable"
              />
              <p className="text-xs text-muted-foreground">{dateHint}</p>
            </div>
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">30 prochains jours</span>
              <span className="text-xs text-muted-foreground">
                {filledCount}/{PLANNING_DAYS} remplis
              </span>
            </div>
            <ul className="rounded-xl border border-border divide-y divide-border max-h-56 overflow-y-auto">
              {days.map((day) => {
                const entry = byDate[day];
                const isToday = day === today;
                return (
                  <li key={day} className="flex items-center gap-2 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-bold ${
                          isToday ? "text-primary" : "text-foreground/80"
                        }`}
                      >
                        {formatISODate(day)}
                        {isToday ? " · aujourd'hui" : ""}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {entry
                          ? entry.scripture_reference || entry.title
                          : "— vide —"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => editOn(day, entry)}
                      className="h-7 w-7 grid place-items-center rounded-full border border-border hover:bg-muted transition shrink-0"
                      aria-label={
                        entry ? `Modifier le ${formatISODate(day)}` : `Ajouter le ${formatISODate(day)}`
                      }
                    >
                      {entry ? (
                        <Pencil className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {entry && (
                      <button
                        type="button"
                        onClick={() => removeOn(entry)}
                        className="h-7 w-7 grid place-items-center rounded-full border border-border hover:bg-destructive/10 hover:text-destructive transition shrink-0"
                        aria-label={`Supprimer le verset du ${formatISODate(day)}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              La liste couvre 30 jours ; une date plus lointaine reste
              programmable via le champ « Date d'affichage ».
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1.5" /> Fermer
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
