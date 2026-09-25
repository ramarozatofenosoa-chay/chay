import React, { useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { Image } from "@/components/ui/image";
import ArticleCard from "@/components/media/ArticleCard";
import RadioPlayer from "@/components/radio/RadioPlayer";
import PlaylistCategoryView from "@/components/media/PlaylistCategoryView";
import YouTubeCategoryView from "@/components/media/YouTubeCategoryView";
import FavoritesView from "@/components/media/FavoritesView";
import GalleryViewer from "@/components/media/GalleryViewer";
import { useBackHandler } from "@/hooks/useBackHandler";
import { YOUTUBE_SECTIONS, GALLERY_SECTIONS, normalizeSection } from "@/lib/mediaConstants";

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

// Tuile de section au même gabarit que la grille Multimédia (CategoryGrid) :
// pastille carrée aspect-square + icône h-9/h-10 + libellé text-2xs/md:text-sm.
function SectionTile({ item, onClick }) {
  const Icon = item.icon;
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2">
      <span
        className={`relative aspect-square w-full rounded-[1.5rem] bg-gradient-to-br ${item.tone} grid place-items-center text-white shadow-sm group-hover:-translate-y-1 group-hover:shadow-lg transition-all`}
      >
        <Icon className="h-9 w-9 md:h-10 md:w-10" />
      </span>
      <span className="text-2xs md:text-sm font-semibold text-foreground/70 text-center leading-tight whitespace-nowrap">
        {item.label}
      </span>
    </button>
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
  const [gallerySection, setGallerySection] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(null);

  // Retour imbriqué : depuis une section (Église/Mindset, Culte/Louange),
  // le retour va d'abord à la liste des sections, puis quitte la catégorie —
  // le bouton rond du titre et le bouton matériel suivent la même logique.
  const inSection = Boolean(gallerySection || ytSection);
  const backFromSection = () => {
    if (gallerySection) {
      setGallerySection(null);
      setGalleryIdx(null);
    } else if (ytSection) {
      setYtSection(null);
    }
  };
  useBackHandler(Boolean(gallerySection) && galleryIdx == null, backFromSection);
  useBackHandler(Boolean(ytSection), () => setYtSection(null));

  const handleBack = () => {
    if (inSection) backFromSection();
    else onBack();
  };

  const q = query.trim().toLowerCase();
  const match = (t) => (q ? (t || "").toLowerCase().includes(q) : true);
  const fArticles = articles.filter((a) => match(a.title) || match(a.category));

  // Une photo n'apparaît que dans SA section : celles dont le champ
  // `category` est vide (les photos publiées avant l'ajout des sections)
  // ne sont donc visibles nulle part.
  const sectionImages = gallery.filter(
    (g) => normalizeSection(g.category) === gallerySection
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={handleBack} className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted">
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
            <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-md">
              {YOUTUBE_SECTIONS.map((s) => (
                <SectionTile key={s.id} item={s} onClick={() => setYtSection(s.id)} />
              ))}
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
        <div>
          {!gallerySection ? (
            <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-md">
              {GALLERY_SECTIONS.map((s) => (
                <SectionTile
                  key={s.id}
                  item={s}
                  onClick={() => {
                    setGallerySection(s.id);
                    setGalleryIdx(null);
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setGallerySection(null);
                  setGalleryIdx(null);
                }}
                className="inline-flex items-center gap-1 mb-4 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl px-2 py-2"
              >
                <ChevronLeft className="h-5 w-5" /> Galerie
              </button>

              {sectionImages.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sectionImages.map((g, i) => (
                    <button
                      key={g.id}
                      onClick={() => setGalleryIdx(i)}
                      className="block aspect-square overflow-hidden bg-muted group"
                    >
                      {/* Au doigt, le zoom au survol reste « collé » après le
                          tap et la vignette saute à la fermeture : on le garde
                          donc sur bureau uniquement (md:). */}
                      <Image
                        src={g.image_url}
                        fittingType="fill"
                        className="w-full h-full object-cover md:group-hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/50 text-sm">
                  Aucune image dans cette section.
                </p>
              )}

              <GalleryViewer items={sectionImages} index={galleryIdx} onClose={() => setGalleryIdx(null)} />
            </>
          )}
        </div>
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
