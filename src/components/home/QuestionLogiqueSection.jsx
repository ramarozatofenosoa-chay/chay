import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Brain, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function QuestionLogiqueSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const today = todayISO();
      const todayItems = await base44.entities.QuestionLogique
        .filter({ date: today }, "-date", 1)
        .catch(() => []);
      let current = Array.isArray(todayItems) && todayItems[0] ? todayItems[0] : null;
      if (!current) {
        const latest = await base44.entities.QuestionLogique.list("-date", 1).catch(() => []);
        current = Array.isArray(latest) ? latest[0] : null;
      }
      setItem(current || null);
      setDraft(current?.text || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const text = draft.trim();
    if (!text) { toast({ title: "Texte vide", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (item) {
        await base44.entities.QuestionLogique.update(item.id, { text });
      } else {
        await base44.entities.QuestionLogique.create({ text, date: todayISO() });
      }
      toast({ title: "Question logique publiée" });
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
      <div className="rounded-[1.5rem] md:rounded-[2rem] border border-border bg-card p-5 md:p-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-secondary/10 text-secondary">
              <Brain className="h-5 w-5" />
            </div>
            <h2 className="font-display font-extrabold text-base md:text-lg">Question Logique</h2>
          </div>
          {isAdmin && !editing && (
            <button
              onClick={() => { setDraft(item?.text || ""); setEditing(true); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-primary transition"
            >
              <Pencil className="h-3.5 w-3.5" /> {item ? "Modifier" : "Ajouter"}
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Saisissez la question logique du jour…"
              rows={4}
              className="selectable"
            />
            <div className="flex items-center gap-2">
              <Button onClick={save} disabled={saving} size="sm" className="gap-1.5">
                <Check className="h-4 w-4" /> {saving ? "Publication…" : "Publier"}
              </Button>
              <Button onClick={() => setEditing(false)} variant="outline" size="sm" className="gap-1.5">
                <X className="h-4 w-4" /> Annuler
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="h-16 bg-background rounded-2xl animate-pulse" />
        ) : item ? (
          <p className="selectable text-sm md:text-base leading-relaxed text-foreground/80">
            {item.text}
          </p>
        ) : (
          <p className="text-sm text-foreground/50">
            {isAdmin ? "Aucune question logique publiée. Cliquez sur « Ajouter »." : "Aucune question logique pour aujourd'hui."}
          </p>
        )}
      </div>
    </section>
  );
}