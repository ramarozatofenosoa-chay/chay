import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import VideoPlayer from "@/components/player/VideoPlayer";
import ReactMarkdown from "react-markdown";

const TYPE_LABELS = {
  audio: "Audio",
  video: "Vidéo",
  predication: "Prédication",
  enseignement: "Enseignement",
  annonce: "Annonce",
  evenement: "Événement",
  actualite: "Actualité",
  autre: "Contenu",
};

// Affiche le contenu d'une nouveauté dans l'application (jamais de lien externe).
export default function ContentDetailDialog({ item, open, onOpenChange }) {
  if (!item) return null;

  const isVideo = item.type === "video";
  const isAudio = item.type === "audio";
  const label = TYPE_LABELS[item.type] || "Contenu";
  const date = item.published_at
    ? new Date(item.published_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {item.thumbnail_url && (
          <Image
            src={item.thumbnail_url}
            fittingType="fill"
            className="w-full h-48 rounded-xl mb-4"
          />
        )}

        <DialogHeader>
          <DialogTitle className="text-2xl">{item.title}</DialogTitle>
          <DialogDescription>
            {label}
            {date ? ` · ${date}` : ""}
          </DialogDescription>
        </DialogHeader>

        {isVideo && item.media_url && (
          <VideoPlayer src={item.media_url} className="w-full max-h-72 rounded-xl" />
        )}
        {isAudio && item.media_url && (
          <audio controls src={item.media_url} className="w-full mt-2" />
        )}

        {item.description && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed selectable mt-2">
            <ReactMarkdown>{item.description || ""}</ReactMarkdown>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}