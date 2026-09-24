import React, { useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { Image } from "@/components/ui/image";
import ArticleCard from "@/components/media/ArticleCard";
import RadioPlayer from "@/components/radio/RadioPlayer";
import PlaylistCategoryView from "@/components/media/PlaylistCategoryView";
import YouTubeCategoryView from "@/components/media/YouTubeCategoryView";
import FavoritesView from "@/components/media/FavoritesView";
import GalleryViewer from "@/components/media/GalleryViewer";
import { YOUTUBE_SECTIONS } from "@/lib/mediaConstants";

const TITLES = {
  radio: "Radio",
  music: "Musique",
  sermons: "Prédication",
  films: "Films",
  youtube: "YouTube",
  articles: "Articles",
  gallery: "Galerie",
  playlist: "Votre Playlist",
};

function SearchBar({ query, setQuery, placeholder }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 mb-5">
      <Search className="h-4 w-4 text-foreground/40" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Rechercher…"}
        className="bg-transparent outline-none text-sm font-medium flex-1"
      />
    </div>
  );
}

export default function MediaCategory({
  cat, data, query, setQuery, onBack,
  currentTrack, isPlaying, play, playQueue, toggle,
  addToPlaylist, removeFromPlaylist, playPlaylistItem, isPinned,
  playlists = [], playlistTracks = [],
  onAddToAdminPlaylist, onCreatePlaylist, onRemovePlaylistTrack, onSaved, isAdmin,
}) {
  const { articles, youtube, gallery, playlist } = data;
  const [ytSection, setYtSection] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(null);

  const q = query.trim().toLowerCase();
  const match = (t) => (q ? (t || "").toLowerCase().includes(q) : true);
  const fArticles = articles.filter((a) => match(a.title) || match(a.category));

  const galleryImages = gallery.map((g) => g.image_url).filter(Boolean);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display font-extrabold text-2xl">{TITLES[cat]}</h2>
      </div>

      {cat === "radio" && <RadioPlayer />}

      {cat === "music" && (
        <PlaylistCategoryView
          category="music" kind="audio" favoriteCategory="music"
          playlists={playlists} playlistTracks={playlistTracks}
          currentTrack={currentTrack} isPlaying={isPlaying} playQueue={playQueue} toggle={toggle}
          isAdmin={isAdmin} onCreatePlaylist={() => onCreatePlaylist("music")} onSaved={onSaved}
          onToggleFavorite={addToPlaylist} isFavorite={isPinned}
        />
      )}

      {cat === "sermons" && (
        <PlaylistCategoryView
          category="sermons" kind="audio" favoriteCategory="sermons"
          playlists={playlists} playlistTracks={playlistTracks}
          currentTrack={currentTrack} isPlaying={isPlaying} playQueue={playQueue} toggle={toggle}
          isAdmin={isAdmin} onCreatePlaylist={() => onCreatePlaylist("sermons")} onSaved={onSaved}
          onToggleFavorite={addToPlaylist} isFavorite={isPinned}
        />
      )}

      {cat === "films" && (
        <PlaylistCategoryView
          category="films" kind="video" favoriteCategory="films"
          playlists={playlists} playlistTracks={playlistTracks}
          currentTrack={currentTrack} isPlaying={isPlaying} playQueue={playQueue} toggle={toggle}
          isAdmin={isAdmin} onCreatePlaylist={() => onCreatePlaylist("films")} onSaved={onSaved}
          onToggleFavorite={addToPlaylist} isFavorite={isPinned}
        />
      )}

      {cat === "youtube" && (
        <div>
          {!ytSection ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              {YOUTUBE_SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setYtSection(s.id)}
                    className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${s.tone} text-white shadow-md transition group-hover:scale-105`}>
                      <Icon className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{s.label}</h3>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setYtSection(null)}
                className="inline-flex items-center gap-1 mb-4 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl px-2 py-2"
              >
                <ChevronLeft className="h-5 w-5" /> YouTube
              </button>
              <YouTubeCategoryView section={ytSection} youtube={youtube} isAdmin={isAdmin} onSaved={onSaved} />
            </div>
          )}
        </div>
      )}

      {cat === "articles" && (
        <>
          <SearchBar query={query} setQuery={setQuery} placeholder="Rechercher un article…" />
          {fArticles.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fArticles.map((a) => (<ArticleCard key={a.id} article={a} />))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucun article publié.</p>
          )}
        </>
      )}

      {cat === "gallery" && (
        <>
          {gallery.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => setGalleryIdx(i)}
                  className="block aspect-square overflow-hidden bg-muted group"
                >
                  <Image src={g.image_url} fittingType="fill" className="w-full h-full group-hover:scale-105 transition" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucune image dans la galerie.</p>
          )}
          <GalleryViewer images={galleryImages} index={galleryIdx} onClose={() => setGalleryIdx(null)} />
        </>
      )}

      {cat === "playlist" && (
        <FavoritesView
          playlist={playlist}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          playPlaylistItem={playPlaylistItem}
          removeFromPlaylist={removeFromPlaylist}
        />
      )}
    </div>
  );
}
