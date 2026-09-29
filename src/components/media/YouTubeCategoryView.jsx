import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import YouTubeCard from "@/components/media/YouTubeCard";
import AddYouTubeLinkModal from "@/components/media/AddYouTubeLinkModal";
import YouTubeViewer from "@/components/media/YouTubeViewer";

export default function YouTubeCategoryView({
  section,
  youtube = [],
  isAdmin,
  onSaved,
  targetVideoId,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const items = youtube.filter((y) => (y.section || "culte") === section);
  const sectionLabels = { culte: "Culte", louange: "Louange", celebration: "Célébration" };

  useEffect(() => {
    if (!targetVideoId) return;
    const targetIndex = items.findIndex((video) => video.id === targetVideoId);
    setPlayingIndex(targetIndex >= 0 ? targetIndex : null);
  }, [targetVideoId, section, youtube]);

  const handleVideoEnd = () => {
    if (playingIndex !== null && playingIndex < items.length - 1) {
      setPlayingIndex(playingIndex + 1);
    }
  };

  const closeVideo = () => {
    setPlayingIndex(null);
    if (searchParams.has("video")) {
      const next = new URLSearchParams(searchParams);
      next.delete("video");
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-foreground/55">
          Vidéos YouTube — {sectionLabels[section] || section}.
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
          {items.map((y, i) => (
            <YouTubeCard
              key={y.id}
              video={y}
              index={i}
              playingIndex={playingIndex}
              onPlay={(idx) => setPlayingIndex(idx)}
            />
          ))}
        </div>
      ) : (
        <p className="text-foreground/50 text-sm">Aucune vidéo pour le moment.</p>
      )}
      {targetVideoId && !items.some((video) => video.id === targetVideoId) && (
        <p role="status" className="mt-4 text-sm text-foreground/60">
          Cette vidéo n'est plus disponible dans cette section.
        </p>
      )}

      <AddYouTubeLinkModal open={addOpen} onOpenChange={setAddOpen} section={section} onSaved={onSaved} />

      {playingIndex !== null && items[playingIndex] && (
        <YouTubeViewer
          video={items[playingIndex]}
          videos={items}
          currentIndex={playingIndex}
          open={playingIndex !== null}
          onClose={closeVideo}
          onEnded={handleVideoEnd}
        />
      )}
    </div>
  );
}