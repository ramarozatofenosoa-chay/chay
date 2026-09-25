import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Bell, CalendarDays, Clock, Pencil, Plus, X } from "lucide-react";
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
  fromISODate,
  formatISODate,
  isISODate,
  addDaysISO,
} from "@/lib/localDate";
import PeriodPlanner from "@/components/home/PeriodPlanner";
import useStagedPublish from "@/hooks/useStagedPublish";

// Les réunions sont espacées : 500 annonces de type « event » couvrent
// plusieurs années d'historique.
const PLANNING_LIMIT = 500;

// Prochaine réunion : affiche l'événement le plus proche à venir (aujourd'hui
// ou plus tard) et permet à un administrateur de le programmer à l'avance,
// avec le même système que le verset du jour (date d'affichage + planning).
// Une réunion passée n'est jamais supprimée avec le temps : elle reste
// consultable dans le planning via « Précédents ».
export default function ProchaineReunionSection({ refreshKey = 0 }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [reunion, setReunion] = useState(null);
  const [events, setEvents] = useState([]); // réunions chargées (planning)
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [draft, setDraft] = useState({
    id: undefined, // entrée sélectionnée dans le planning ; undefined = nouvelle
    title: "",
    body: "",
    date: toISODate(),
  });

  // File « à publier » : on enregistre plusieurs réunions dans la fenêtre,
  // rien ne part au serveur, puis un seul « Publier » les écrit toutes.
  const { pending, publishing, stage, discard, publish } = useStagedPublish({
    entity: base44.entities.Announcement,
    dateField: "date",
    build: (p) => ({
      title: (p.title || "").trim(),
      body: (p.body || "").trim() || "",
      date: p.date,
      type: "event",
      language: "fr",
    }),
    // On met à jour l'entrée sélectionnée ; à défaut on en crée une. Une
    // collision de date est REFUSÉE plutôt qu'écrasée : deux réunions peuvent
    // cohabiter un même jour, remplacer silencieusement l'autre ferait perdre
    // son contenu. `null` = date déjà occupée.
    resolveId: (d, prev, server) => {
      const id = d.id ?? prev?.id ?? undefined;
      return id === undefined && server ? null : id;
    },
  });

  // Plus proche réunion à venir : aujourd'hui ou plus tard, la première.
  const upcomingOf = (list) => {
    const now = toISODate();
    const upcoming = list
      .filter((a) => a.date >= now)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return upcoming[0] || null;
  };

  const loadEvents = async (limit) => {
    const rows = await base44.entities.Announcement
      .filter({ type: "event" }, "-date", limit)
      .catch(() => []);
    return (Array.isArray(rows) ? rows : []).filter((a) => isISODate(a.date));
  };

  const load = async () => {
    try {
      const list = await loadEvents(100);
      setReunion(upcomingOf(list));
    } finally {
      setLoading(false);
    }
  };

  // Chargé à l'ouverture de la fenêtre : `events` ne contient QUE le planning
  // complet, pour qu'un rafraîchissement de l'accueil ne le remplace jamais
  // par la courte liste récente (l'historique disparaîtrait alors à l'écran).
  const loadPlanning = async () => {
    setPlanningLoading(true);
    try {
      const list = await loadEvents(PLANNING_LIMIT);
      setEvents(list);
      setReunion(upcomingOf(list));
    } finally {
      setPlanningLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const openEdit = () => {
    const base = reunion;
    setDraft({
      id: base?.id,
      title: base?.title || "",
      body: base?.body || "",
      date: base?.date || toISODate(),
    });
    setEditing(true);
    loadPlanning();
  };

  // Clic sur une ligne du planning : charge ce jour dans le formulaire.
  const editOn = (day, entry) => {
    setDraft({
      id: entry?.id,
      title: entry?.title || "",
      body: entry?.body || "",
      date: day,
    });
  };

  // Enregistre le formulaire dans la file « à publier » (rien n'est envoyé)
  // et repart sur une nouvelle réunion pour enchaîner les saisies.
  const stageCurrent = () => {
    const title = draft.title.trim();
    const day = draft.date;
    if (!title) {
      toast({ title: "Titre requis", variant: "destructive" });
      return;
    }
    if (!isISODate(day)) {
      toast({ title: "Date invalide", variant: "destructive" });
      return;
    }
    const res = stage(
      draft,
      events,
      "Une réunion existe déjà à cette date — clique sur le crayon de cette journée dans le planning pour la modifier."
    );
    if (!res.ok) {
      toast({ title: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: "Ajouté à la liste",
      description: `${res.pendingCount} en attente — rien n'est encore publié.`,
    });
    setDraft({
      id: undefined,
      title: "",
      body: "",
      date: addDaysISO(day, 1),
    });
  };

  // Écrit toute la file d'un coup.
  const publishAll = async () => {
    const res = await publish(events);
    if (res.failed) {
      toast({
        title: "Publication partielle",
        description: `${res.ok} publiée(s), ${res.failed} en échec.`,
        variant: "destructive",
      });
      await load();
      await loadPlanning();
      return; // la fenêtre reste ouverte pour retenter celles qui ont échoué
    }
    toast({
      title: "Publication réussie",
      description: `${res.ok} réunion(s) programmée(s).`,
    });
    setEditing(false);
    await load();
    await loadPlanning();
  };

  // Fermeture : les entrées en attente restent dans la fenêtre (on peut la
  // rouvrir et tout y est) — le rappel le dit explicitement.
  const closeDialog = (open) => {
    if (!open && pending.length) {
      toast({
        title: `${pending.length} réunion(s) en attente`,
        description:
          "Elles restent dans la fenêtre si tu la rouvres (perdus seulement si tu recharges la page).",
      });
    }
    setEditing(open);
  };

  const removeOn = async (entry) => {
    // Entrée en attente : on la retire de la file, aucun appel serveur.
    if (entry.__pending) {
      discard(entry.date);
      toast({ title: "Retiré de la liste", description: "Rien n'était publié." });
      return;
    }
    const when = formatISODate(entry.date, { long: true });
    if (!window.confirm(`Supprimer la réunion du ${when} ?`)) return;
    try {
      await base44.entities.Announcement.delete(entry.id);
      toast({ title: "Réunion supprimée", description: when });
      await load();
      await loadPlanning();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const today = toISODate();
  const dateHint = !isISODate(draft.date)
    ? "Choisissez une date."
    : draft.date < today
      ? "Date passée : cette réunion n'apparaîtra plus dans « Prochaine réunion »."
      : draft.date === today
        ? "Apparaît dès aujourd'hui."
        : `Apparaîtra automatiquement le ${formatISODate(draft.date, { long: true })}.`;

  const reunionDate = reunion?.date
    ? fromISODate(reunion.date)?.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      })
    : null;

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
              {reunionDate && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-primary">
                  <Clock className="h-3.5 w-3.5" /> {reunionDate}
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

      <Dialog open={editing} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programmer la prochaine réunion</DialogTitle>
            <DialogDescription>
              Renseignez le titre, la description et la date : la réunion
              apparaît automatiquement dans « Prochaine réunion » dès cette
              date.
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
                onChange={(e) =>
                  // Changer la date repart d'une nouvelle réunion : le
                  // brouillon ne doit plus cibler l'entrée du jour précédent.
                  setDraft((d) => ({ ...d, date: e.target.value, id: undefined }))
                }
                className="selectable"
              />
              <p className="text-xs text-muted-foreground">{dateHint}</p>
            </div>

            <Button
              variant="outline"
              onClick={stageCurrent}
              disabled={publishing}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Enregistrer dans la liste
            </Button>
          </div>

          <PeriodPlanner
            today={today}
            focusDate={draft.date}
            entries={[...pending, ...events]}
            dateField="date"
            labelFor={(e) => e.title || ""}
            onPick={editOn}
            onDelete={removeOn}
            loading={planningLoading}
            pendingCount={pending.length}
          />

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => closeDialog(false)}
              disabled={publishing}
            >
              <X className="h-4 w-4 mr-1.5" /> Fermer
            </Button>
            <Button
              onClick={publishAll}
              disabled={publishing || planningLoading || !pending.length}
            >
              {publishing
                ? "Publication…"
                : pending.length
                  ? `Publier (${pending.length})`
                  : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
