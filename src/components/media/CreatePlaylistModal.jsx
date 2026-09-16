import React, { useState, useEffect, useRef } from "react";
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
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Library, Upload, Music, Sparkles } from "lucide-react";
import ImageCrop from "@/components/media/ImageCrop";

export default function CreatePlaylistModal({
  open,
  onOpenChange,
  onSaved,
  category = "music",
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState(null);
  const [iconChosen, setIconChosen] = useState(false);
  const [rawFile, setRawFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setCoverUrl(null);
      setIconChosen(false);
      setRawFile(null);
      setUploading(false);
    }
  }, [open]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setRawFile(f);
    e.target.value = "";
  };

  const onCropConfirm = async (blob) => {
    setUploading(true);
    try {
      const file = new File([blob], "icon.jpg", { type: "image/jpeg" });
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setCoverUrl(res.file_url);
      setIconChosen(true);
      setRawFile(null);
    } catch (err) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const useDefault = () => {
    setCoverUrl(null);
    setIconChosen(true);
    setRawFile(null);
  };

  const create = async () => {
    if (!name.trim() || !iconChosen) return;
    setSaving(true);
    try {
      await base44.entities.Playlist.create({
        name: name.trim(),
        description: description.trim() || null,
        cover_url: coverUrl || null,
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

  const Icon = Music;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-extrabold">
            <Library className="h-5 w-5 text-primary" /> Créer une playlist
          </DialogTitle>
          <DialogDescription>
            Valable pour toute la Médiathèque : musique, prédications, films.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Icône */}
          <div className="space-y-2">
            <Label>Icône de la playlist</Label>
            {rawFile ? (
              <ImageCrop
                file={rawFile}
                onCancel={() => setRawFile(null)}
                onConfirm={onCropConfirm}
              />
            ) : uploading ? (
              <div className="flex items-center justify-center h-32 text-sm text-foreground/60 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Téléversement…
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 grid place-items-center brand-gradient">
                  {coverUrl ? (
                    <Image src={coverUrl} fittingType="fill" className="w-full h-full" />
                  ) : (
                    <Icon className="h-7 w-7 text-white/90" />
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full text-sm font-bold"
                  >
                    <Upload className="h-4 w-4 mr-1.5" /> Choisir une image
                  </Button>
                  <button
                    type="button"
                    onClick={useDefault}
                    className="text-xs text-foreground/55 hover:text-foreground inline-flex items-center gap-1 self-start"
                  >
                    <Sparkles className="h-3 w-3" /> Utiliser l'icône par défaut
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  className="hidden"
                />
              </div>
            )}
          </div>

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
            disabled={saving || uploading || !name.trim() || !iconChosen}
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