import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Library } from "lucide-react";

export default function CreatePlaylistModal({ open, onOpenChange, onSaved, category = "music" }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Playlist.create({
        name: name.trim(),
        description: description.trim() || null,
        category,
      });
      toast({ title: "Playlist créée" });
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-extrabold">
            <Library className="h-5 w-5 text-primary" /> Créer une playlist
          </DialogTitle>
          <DialogDescription>Donnez un nom à votre playlist musicale.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="pl-name">Nom de la playlist</Label>
            <Input
              id="pl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Louanges du dimanche"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-desc">Description (optionnel)</Label>
            <Textarea
              id="pl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Quelques mots…"
            />
          </div>
          <Button
            onClick={create}
            disabled={saving || !name.trim()}
            className="w-full brand-gradient text-white border-0"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Créer la playlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}