import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Upload, Music2, Mic, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const TYPES = [
  { id: "music", label: "Musique", icon: Music2, entity: "MusicTrack" },
  { id: "sermon", label: "Prédication", icon: Mic, entity: "Sermon" },
  { id: "video", label: "Vidéo", icon: Film, entity: "Video" },
];

export default function MediaUploader({ onClose, onSaved }) {
  const [type, setType] = useState("music");
  const [form, setForm] = useState({ title: "", artist: "", speaker: "", category: "", description: "", date: "" });
  const [mediaFile, setMediaFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!mediaFile) { toast({ title: "Sélectionnez un fichier à importer.", variant: "destructive" }); return; }
    if (!form.title.trim()) { toast({ title: "Le titre est requis.", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const media = await base44.integrations.Core.UploadFile({ file: mediaFile });
      let coverUrl = "";
      if (coverFile) {
        const cover = await base44.integrations.Core.UploadFile({ file: coverFile });
        coverUrl = cover.file_url;
      }

      if (type === "music") {
        await base44.entities.MusicTrack.create({
          title: form.title, artist: form.artist || "CHAY", album: "", category: form.category || "Louange",
          cover_url: coverUrl, audio_url: media.file_url,
        });
      } else if (type === "sermon") {
        await base44.entities.Sermon.create({
          title: form.title, speaker: form.speaker || "Pasteur", category: form.category || "Prédication",
          date: form.date || new Date().toISOString().slice(0, 10),
          cover_url: coverUrl, audio_url: media.file_url,
        });
      } else {
        await base44.entities.Video.create({
          title: form.title, description: form.description || "", category: form.category || "Enseignement",
          cover_url: coverUrl, video_url: media.file_url,
        });
      }

      toast({ title: "Importé avec succès !", description: form.title });
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast({ title: "Échec de l'import", description: err.message || "Réessayez.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[1.5rem] bg-background border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-extrabold text-xl flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Importer un contenu
          </h2>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="inline-flex rounded-full border border-border bg-card p-1 gap-1">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button type="button" key={t.id} onClick={() => setType(t.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${
                    type === t.id ? "bg-primary text-primary-foreground" : "text-foreground/60"
                  }`}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Titre du contenu" required />
          </div>

          {type === "music" && (
            <div className="space-y-2">
              <Label htmlFor="artist">Artiste</Label>
              <Input id="artist" value={form.artist} onChange={(e) => set("artist", e.target.value)} placeholder="CHAY Worship" />
            </div>
          )}
          {type === "sermon" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="speaker">Prédicateur</Label>
                <Input id="speaker" value={form.speaker} onChange={(e) => set("speaker", e.target.value)} placeholder="Pasteur Jean" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
            </>
          )}
          {type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Courte description" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Input id="category" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Louange / Enseignement…" />
          </div>

          <div className="space-y-2">
            <Label>{type === "video" ? "Fichier vidéo *" : "Fichier audio *"} <span className="text-xs text-muted-foreground font-normal">(depuis votre ordinateur)</span></Label>
            <label className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-4 cursor-pointer hover:border-primary transition">
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium truncate flex-1">{mediaFile ? mediaFile.name : "Choisir un fichier…"}</span>
              <input
                type="file"
                accept={type === "video" ? "video/*" : "audio/*"}
                className="hidden"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label>Cover image <span className="text-xs text-muted-foreground font-normal">(optionnel)</span></Label>
            <label className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-4 cursor-pointer hover:border-primary transition">
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium truncate flex-1">{coverFile ? coverFile.name : "Choisir une image…"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
            {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Import en cours…</>) : "Importer"}
          </Button>
        </form>
      </div>
    </div>
  );
}