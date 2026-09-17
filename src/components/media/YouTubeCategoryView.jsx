import React, { useState } from "react";
import { Plus } from "lucide-react";
import YouTubeCard from "@/components/media/YouTubeCard";
import AddYouTubeLinkModal from "@/components/media/AddYouTubeLinkModal";

export default function YouTubeCategoryView({ section, youtube = [], isAdmin, onSaved }) {
  const [addOpen, setAddOpen] = useState(false);
  const items = youtube.filter((y) => (y.section || "culte") === section);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-foreground/55">
          Vidéos YouTube — {section === "culte" ? "Cultes" : "Louange"}.
        </p>
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold hover:scale-105 transition"
          >
            <Plus className="h-4 w-4" /> Ajouter un lien
          </button>
        )}
      </div>

      {items.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {items.map((y) => (
            <YouTubeCard key={y.id} video={y} />
          ))}
        </div>
      ) : (
        <p className="text-foreground/50 text-sm">Aucune vidéo pour le moment.</p>
      )}

      <AddYouTubeLinkModal open={addOpen} onOpenChange={setAddOpen} section={section} onSaved={onSaved} />
    </div>
  );
}