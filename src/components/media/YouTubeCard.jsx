import React, { useState } from "react";
import { Play } from "lucide-react";

function ytThumb(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export default function YouTubeCard({ video }) {
  const [playing, setPlaying] = useState(false);
  const thumb = video.thumbnail_url || ytThumb(video.youtube_id);

  return (
    <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden">
      {playing ? (
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="relative w-full aspect-video grid place-items-center group overflow-hidden"
        >
          <img
            src={thumb}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <span className="relative grid place-items-center h-14 w-14 rounded-full bg-primary/90 text-white group-hover:scale-110 transition shadow-lg">
            <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
          </span>
        </button>
      )}
      <div className="p-4">
        <h3 className="font-bold line-clamp-2">{video.title}</h3>
        {video.category && (
          <span className="text-xs text-foreground/45 mt-0.5 block">{video.category}</span>
        )}
      </div>
    </div>
  );
}