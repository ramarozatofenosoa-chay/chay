import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Youtube, Image as ImageIcon, Loader2 } from "lucide-react";

const TYPES = [
  { id: "article", label: "Article", icon: FileText },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "gallery", label: "Galerie", icon: ImageIcon },
];

function extractYtId(value) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  const m = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : "";
}

export default function ContentAddModal({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [type, setType] = useState("article");
  const [loading, setLoading] = useState(false);

  const [article, setArticle] = useState({
    title: "",
    excerpt: "",
    body: "",
    cover_url: "",
    category: "",
    author: "",
  });
  const [yt, setYt] = useState({
    title: "",
    youtube_id: "",
    category: "",
    thumbnail_url: "",
  });
  const [gallery, setGallery] = useState({
    title: "",
    image_url: "",
    category: "",
  });

  const reset = () => {
    setArticle({ title: "", excerpt: "", body: "", cover_url: "", category: "", author: "" });
    setYt({ title: "", youtube_id: "", category: "", thumbnail_url: "" });
    setGallery({ title: "", image_url: "", category: "" });
  };

  const submit = async () => {
    setLoading(true);
    try {
      if (type === "article") {
        if (!article.title.trim() || !article.body.trim()) {
          toast({ title: "Titre et contenu requis", variant: "destructive" });
          return;
        }
        await base44.entities.Article.create(article);
      } else if (type === "youtube") {
        const id = extractYtId(yt.youtube_id.trim());
        if (!yt.title.trim() || !id) {
          toast({ title: "Titre et lien/ID YouTube valides requis", variant: "destructive" });
          return;
        }
        await base44.entities.YouTubeVideo.create({
          title: yt.title,
          youtube_id: id,
          category: yt.category,
          thumbnail_url: yt.thumbnail_url,
        });
      } else {
        if (!gallery.title.trim() || !gallery.image_url.trim()) {
          toast({ title: "Titre et URL d'image requis", variant: "destructive" });
          return;
        }
        await base44.entities.GalleryImage.create(gallery);
      }
      toast({ title: "Contenu ajouté" });
      reset();
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter du contenu</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-5">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex-1 inline-flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition ${
                  type === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground/60 hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {type === "article" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input
                value={article.title}
                onChange={(e) => setArticle({ ...article, title: e.target.value })}
                placeholder="Titre de l'article"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Auteur</Label>
              <Input
                value={article.author}
                onChange={(e) => setArticle({ ...article, author: e.target.value })}
                placeholder="Auteur"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Input
                  value={article.category}
                  onChange={(e) => setArticle({ ...article, category: e.target.value })}
                  placeholder="Ex. Enseignement"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Image (URL)</Label>
                <Input
                  value={article.cover_url}
                  onChange={(e) => setArticle({ ...article, cover_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Extrait</Label>
              <Textarea
                value={article.excerpt}
                onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
                placeholder="Résumé court…"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contenu (Markdown) *</Label>
              <Textarea
                value={article.body}
                onChange={(e) => setArticle({ ...article, body: e.target.value })}
                placeholder="## Titre&#10;Votre texte…"
                rows={6}
              />
            </div>
          </div>
        )}

        {type === "youtube" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input
                value={yt.title}
                onChange={(e) => setYt({ ...yt, title: e.target.value })}
                placeholder="Titre de la vidéo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lien ou ID YouTube *</Label>
              <Input
                value={yt.youtube_id}
                onChange={(e) => setYt({ ...yt, youtube_id: e.target.value })}
                placeholder="https://youtube.com/watch?v=… ou ID"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Input
                  value={yt.category}
                  onChange={(e) => setYt({ ...yt, category: e.target.value })}
                  placeholder="Ex. Louange"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vignette (URL)</Label>
                <Input
                  value={yt.thumbnail_url}
                  onChange={(e) => setYt({ ...yt, thumbnail_url: e.target.value })}
                  placeholder="Auto si vide"
                />
              </div>
            </div>
          </div>
        )}

        {type === "gallery" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input
                value={gallery.title}
                onChange={(e) => setGallery({ ...gallery, title: e.target.value })}
                placeholder="Légende de l'image"
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL de l'image *</Label>
              <Input
                value={gallery.image_url}
                onChange={(e) => setGallery({ ...gallery, image_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Input
                value={gallery.category}
                onChange={(e) => setGallery({ ...gallery, category: e.target.value })}
                placeholder="Ex. Événement"
              />
            </div>
          </div>
        )}

        <Button className="w-full mt-4" onClick={submit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement…
            </>
          ) : (
            "Publier"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}