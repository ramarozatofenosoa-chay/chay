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
import { base44 } from "@/api/base44Client";
import { uploadToBase44 } from "@/lib/upload";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Library, Upload } from "lucide-react";
import ImageCrop from "@/components/media/ImageCrop";
import PlaylistCover from "@/components/media/PlaylistCover";
import { isValidPlaylistImageUrl } from "@/lib/playlist";

export default function CreatePlaylistModal({
  open,
  onOpenChange,
  onSaved,
  category = "music",
  playlist = null,
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const pendingPlaylistIdRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(playlist?.name || "");
      setDescription(playlist?.description || "");
      setCoverUrl(playlist?.cover_url || null);
      setRawFile(null);
      setUploading(false);
      pendingPlaylistIdRef.current = null;
    } else {
      pendingPlaylistIdRef.current = null;
    }
  }, [open, playlist]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f && !f.type.startsWith("image/")) {
      toast({
        title: "Fichier non valide",
        description: "Choisissez un fichier image pour la playlist.",
        variant: "destructive",
      });
    } else if (f) {
      setRawFile(f);
    }
    e.target.value = "";
  };

  const onCropConfirm = async (blob) => {
    setUploading(true);
    try {
      const file = new File([blob], "icon.jpg", { type: "image/jpeg" });
      // Core.UploadFile : seule API d'upload officielle du SDK Base44.
      const url = await uploadToBase44(file);
      setCoverUrl(url);
      setRawFile(null);
      toast({ title: "Image enregistrée" });
    } catch (err) {
      toast({ title: "Erreur upload image", description: err.message || "Réessayez", variant: "destructive" });
      setRawFile(null);
    }
    setUploading(false);
  };

  const save = async () => {
    if (!name.trim() || !isValidPlaylistImageUrl(coverUrl)) return;
    setSaving(true);
    try {
      const playlistData = {
        name: name.trim(),
        description: description.trim() || null,
        cover_url: coverUrl,
        category: playlist?.category || category,
      };
      const playlistId = playlist?.id || pendingPlaylistIdRef.current;
      let savedPlaylist;

      if (playlistId) {
        await base44.entities.Playlist.update(playlistId, playlistData);
        savedPlaylist = await base44.entities.Playlist.get(playlistId);
      } else {
        savedPlaylist = await base44.entities.Playlist.create(playlistData);
        if (!savedPlaylist?.id) {
          throw new Error("Base44 n'a pas renvoyé l'identifiant de la playlist.");
        }
        pendingPlaylistIdRef.current = savedPlaylist.id;
        savedPlaylist = await base44.entities.Playlist.get(savedPlaylist.id);
      }

      const matchesSubmittedData = (saved) =>
        saved?.name === playlistData.name &&
        saved?.cover_url === playlistData.cover_url &&
        (saved?.description ?? null) === playlistData.description;
      if (!matchesSubmittedData(savedPlaylist)) {
        const id = playlistId || pendingPlaylistIdRef.current;
        await base44.entities.Playlist.update(id, playlistData);
        savedPlaylist = await base44.entities.Playlist.get(id);
      }
      if (!matchesSubmittedData(savedPlaylist)) {
        toast({
          title: "Playlist non enregistrée",
          description:
            "Le nom ou l'image n'a pas été conservé par Base44. Vérifiez les champs « name » et « cover_url » de l'entité Playlist, puis publiez.",
          variant: "destructive",
        });
        return;
      }

      pendingPlaylistIdRef.current = null;
      toast({ title: playlist ? "Playlist modifiée" : "Playlist créée" });
      onOpenChange(false);
      onSaved?.(savedPlaylist);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && (saving || uploading)) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-md rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-extrabold">
            <Library className="h-5 w-5 text-primary" /> {playlist ? "Modifier la playlist" : "Créer une playlist"}
          </DialogTitle>
          <DialogDescription>
            {playlist
              ? "Modifiez le nom, la description ou l'image de cette playlist."
              : "Valable pour toute la Médiathèque : musique, prédications, films."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image de couverture obligatoire */}
          <div className="space-y-2">
            <Label>Image de la playlist <span className="text-destructive">*</span></Label>
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
                <PlaylistCover
                  playlist={{ name, cover_url: coverUrl }}
                  className="h-20 w-20 shrink-0 rounded-2xl"
                />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full text-sm font-bold"
                  >
                    <Upload className="h-4 w-4 mr-1.5" /> {coverUrl ? "Changer l'image" : "Choisir une image"}
                  </Button>
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
            {!isValidPlaylistImageUrl(coverUrl) && !rawFile && (
              <p className="text-xs text-destructive" role="alert">
                L'ajout d'une image est obligatoire pour enregistrer la playlist.
              </p>
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
            onClick={save}
            disabled={saving || uploading || !name.trim() || !isValidPlaylistImageUrl(coverUrl)}
            className="w-full brand-gradient text-white border-0"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {playlist ? "Enregistrer les modifications" : "Créer la playlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}