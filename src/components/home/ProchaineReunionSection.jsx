import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Bell, CalendarDays, Clock, Pencil, Check, X } from "lucide-react";
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

// Prochaine réunion : affiche le prochain événement (Announcement de type
// "event") et permet à un administrateur de l'ajouter/modifier directement
// (bouton "Ajouter"), sur le même principe que la Question Logique.
export default function ProchaineReunionSection({ refreshKey = 0 }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [reunion, setReunion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", date: todayISO() });

  const load = async () => {
    try {
      const anns = await base44.entities.Announcement.list("-date", 30).catch(
        () => []
      );
      const all = Array.isArray(anns) ? anns : [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const events = all.filter((a) => a.type === "event");
      const upcoming = events
        .filter((a) => a.date && new Date(a.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setReunion(upcoming[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const openEdit = () => {
    setDraft({
      title: reunion?.title || "",
      body: reunion?.body || "",
      date: reunion?.date || todayISO(),
    });
    setEditing(true);
  };

  const save = async () => {
    const title = draft.title.trim();
    const date = draft.date || todayISO();
    if (!title || !date) {
      toast({ title: "Titre et date requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        body: draft.body.trim() || "",
        date,
        type: "event",
        language: "fr",
      };
      if (reunion) {
        await base44.entities.Announcement.update(reunion.id, payload);
      } else {
        await base44.entities.Announcement.create(payload);
      }
      toast({ title: "Réunion publiée" });
      setEditing(false);
      await load();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6">
      <div className="rounded-[1.5rem] border border-border bg-card p-5 md:p-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-display font-extrabold text-base md:text-xl">
              Prochaine réunion
            </h2>
          </div>
          {isAdmin && !editing && (
            <button
              onClick={openEdit}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-primary transition"
            >
              <Pencil className="h-3.5 w-3.5" /> {reunion ? "Modifier" : "Ajouter"}
            </button>
          )}
        </div>
        {loading ? (
          <div className="h-16 bg-background rounded-2xl animate-pulse" />
        ) : reunion ? (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm md:text-lg">{reunion.title}</div>
              {reunion.body && (
                <div className="text-foreground/60 text-xs md:text-sm mt-1">
                  {reunion.body}
                </div>
              )}
              {reunion.date && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-primary">
                  <Clock className="h-3.5 w-3.5" />{" "}
                  {new Date(reunion.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/50">
            Aucune réunion annoncée pour le moment.
          </p>
        )}
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prochaine réunion</DialogTitle>
            <DialogDescription>
              Renseignez le titre, la description et la date de la réunion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pr-title">Titre</Label>
              <Input
                id="pr-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Réunion de prière"
                className="selectable"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-body">Description</Label>
              <Textarea
                id="pr-body"
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                rows={3}
                placeholder="Détails de la réunion…"
                className="selectable"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-date">Date</Label>
              <Input
                id="pr-date"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
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