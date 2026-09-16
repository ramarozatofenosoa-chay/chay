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
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

function extractYtId(value) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  const m = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : "";
}

export default function AddYouTubeLinkModal({ open, onOpenChange, section = "culte", onSaved }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setLink("");
    }
  }, [open]);

  const submit = async () => {
    const id = extractYtId(link.trim());
    if (!title.trim() || !id) {
      toast({ title: "Titre et lien YouTube valides requis", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await base44.entities.YouTubeVideo.create({
        title: title.trim(),
        youtube_id: id,
        category: section === "culte" ? "Culte" : "Prédication",
        section,
      });
      toast({ title: "Vidéo ajoutée" });
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une vidéo YouTube</DialogTitle>
          <DialogDescription>
            {section === "culte" ? "Culte" : "Prédication"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="yt-title">Titre *</Label>
            <Input
              id="yt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la vidéo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yt-link">Lien ou ID YouTube *</Label>
            <Input
              id="yt-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
            />
          </div>
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full brand-gradient text-white border-0"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}