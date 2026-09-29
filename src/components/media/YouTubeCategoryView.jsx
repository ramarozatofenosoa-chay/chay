import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import YouTubeCard from "@/components/media/YouTubeCard";
import AddYouTubeLinkModal from "@/components/media/AddYouTubeLinkModal";
import { clearMediaControl, requestMediaPlayback } from "@/lib/mediaControl";

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
  const location = useLocation();
  const items = youtube.filter((y) => (y.section || "culte") === section);
  const sectionLabels = { culte: "Culte", louange: "Louange", celebration: "Célébration" };

  const startVideoAt = useCallback((index) => {
    const video = items[index];
    if (!video?.youtube_id) return;
    const playAt = (targetIndex) => {
      const item = items[targetIndex];
      if (!item?.youtube_id) return;
      let id;
      const stop = () => {
        clearMediaControl(id);
        setPlayingIndex(null);
        if (location.pathname === "/media" && searchParams.has("video")) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("video");
          setSearchParams(nextParams, { replace: true });
        }
      };
      id = requestMediaPlayback({
        type: "youtube",
        engine: "youtube",
        title: item.title || "Vidéo YouTube",
        subtitle: sectionLabels[section] || section,
        artwork: item.thumbnail_url || item.cover_url || `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`,
        source: item.youtube_id,
        isPlaying: true,
        isBuffering: true,
        currentTime: 0,
        duration: 0,
        isLive: false,
        previous: targetIndex > 0 ? () => playAt(targetIndex - 1) : null,
        next: targetIndex < items.length - 1 ? () => playAt(targetIndex + 1) : null,
        queue: items.map((entry) => ({
          id: entry.id,
          title: entry.title,
          source: entry.youtube_id,
          artwork: entry.thumbnail_url || entry.cover_url || null,
        })),
        queueIndex: targetIndex,
        stop,
      }, "youtube");
      setPlayingIndex(targetIndex);
    };
    playAt(index);
  }, [items, section, searchParams, setSearchParams, location.pathname]);

  useEffect(() => {
    if (!targetVideoId) return;
    const targetIndex = items.findIndex((video) => video.id === targetVideoId);
    if (targetIndex >= 0) startVideoAt(targetIndex);
    else setPlayingIndex(null);
  }, [targetVideoId, startVideoAt]);

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
              onPlay={startVideoAt}
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

    </div>
  );
}