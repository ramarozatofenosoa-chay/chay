import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AboutDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.AppNotice.list("-created_date", 50);
      setNotices(Array.isArray(list) ? list : []);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      if (record?.id) {
        await base44.entities.AppContent.update(record.id, { about_text: editText });
      } else {
        await base44.entities.AppContent.create({
          about_text: editText,
          splash_text_mg: "",
          splash_text_fr: "",
        });
      }
      setEditing(false);
      toast({ title: "À Propos mis à jour" });
    } catch (e) {
      toast({ title: "Échec", description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[1.5rem] max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <h2 className="font-display font-extrabold text-2xl">À Propos</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notices.length === 0 ? (
            <p className="text-sm text-foreground/60">
              Bienvenue sur l'Application de l'Église Chay.
            </p>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="space-y-1">
                  {n.title && (
                    <p className="font-bold text-sm text-foreground">{n.title}</p>
                  )}
                  <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                    {n.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="border-t border-border pt-4 space-y-2">
              {editing ? (
                <>
                  <Textarea
                    rows={6}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Texte de présentation…"
                    className="text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={save}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(true);
                    setEditText(
                      notices.find((n) => n.id === notices[0]?.id)?.text || ""
                    );
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Modifier
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
