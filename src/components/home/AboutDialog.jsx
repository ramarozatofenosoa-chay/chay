import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AboutDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.AppContent.list("-created_date", 1);
      const rec = Array.isArray(list) && list[0] ? list[0] : null;
      setRecord(rec);
      setText(rec?.about_text || "");
    } catch {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      if (record?.id) {
        const updated = await base44.entities.AppContent.update(record.id, {
          about_text: text,
        });
        setRecord(updated);
      } else {
        const created = await base44.entities.AppContent.create({
          about_text: text,
          splash_text_mg: "",
          splash_text_fr: "",
        });
        setRecord(created);
      }
      setEditing(false);
      toast({ title: "À Propos mis à jour" });
    } catch (e) {
      toast({ title: "Échec", description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[1.5rem] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-extrabold text-2xl">
            À Propos
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : editing ? (
          <div className="space-y-3">
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Texte de présentation de l'Église Chay…"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setText(record?.about_text || "");
                }}
              >
                Annuler
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="selectable text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
              {text ||
                "Bienvenue sur l'Application de l'Église Chay, une communauté chrétienne qui proclame le Royaume de Dieu."}
            </p>
            {isAdmin && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Modifier
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}