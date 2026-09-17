import React, { useState } from "react";
import { Play } from "lucide-react";
import YouTubeViewer from "@/components/media/YouTubeViewer";

function ytThumb(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export default function YouTubeCard({ video }) {
  const [open, setOpen] = useState(false);
  const thumb = video.cover_url || video.thumbnail_url || ytThumb(video.youtube_id);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group w-full text-left rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all"
      >
        <div className="relative aspect-video bg-black overflow-hidden">
          <img
            src={thumb}
            alt={video.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid place-items-center h-12 w-12 rounded-full bg-primary/90 text-white shadow-lg group-hover:scale-110 transition">
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            </span>
          </span>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 leading-snug">{video.title}</h3>
          {video.verse_note && (
            <p className="mt-1.5 text-xs text-foreground/55 line-clamp-2 whitespace-pre-line">
              {video.verse_note}
            </p>
          )}
        </div>
      </button>

      <YouTubeViewer video={video} open={open} onClose={() => setOpen(false)} />
    </>
  );
}