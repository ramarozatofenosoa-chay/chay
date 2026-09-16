import React, { useState } from "react";
import {
  ChevronLeft,
  Search,
  Play,
  Pause,
  Film,
  Music,
  Plus,
  Trash2,
  Library,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import ArticleCard from "@/components/media/ArticleCard";
import YouTubeCard from "@/components/media/YouTubeCard";
import RadioPlayer from "@/components/radio/RadioPlayer";
import PlaylistCategoryView from "@/components/media/PlaylistCategoryView";
import YouTubeCategoryView from "@/components/media/YouTubeCategoryView";

const TITLES = {
  radio: "Radio",
  music: "Musique",
  sermons: "Prédications",
  films: "Films",
  "youtube-culte": "Culte",
  "youtube-predication": "Prédications (YT)",
  articles: "Articles",
  gallery: "Galerie",
  playlist: "Votre Playlist",
  playlists: "Playlists",
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
  cat,
  data,
  query,
  setQuery,
  onBack,
  currentTrack,
  isPlaying,
  play,
  playQueue,
  toggle,
  addToPlaylist,
  removeFromPlaylist,
  playPlaylistItem,
  isPinned,
  playlists = [],
  playlistTracks = [],
  onAddToAdminPlaylist,
  onCreatePlaylist,
  onRemovePlaylistTrack,
  onSaved,
  isAdmin,
}) {
  const { articles, youtube, gallery, playlist } = data;
  const [openPlaylist, setOpenPlaylist] = useState(null);
  const q = query.trim().toLowerCase();
  const match = (t) => (q ? (t || "").toLowerCase().includes(q) : true);
  const fArticles = articles.filter((a) => match(a.title) || match(a.category));
  const fGallery = gallery.filter((g) => match(g.title) || match(g.category));

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display font-extrabold text-2xl">{TITLES[cat]}</h2>
      </div>

      {cat === "radio" && <RadioPlayer />}

      {cat === "music" && (
        <PlaylistCategoryView
          category="music"
          kind="audio"
          playlists={playlists}
          playlistTracks={playlistTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          playQueue={playQueue}
          toggle={toggle}
          isAdmin={isAdmin}
          onCreatePlaylist={() => onCreatePlaylist("music")}
          onSaved={onSaved}
        />
      )}

      {cat === "sermons" && (
        <PlaylistCategoryView
          category="sermons"
          kind="audio"
          playlists={playlists}
          playlistTracks={playlistTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          playQueue={playQueue}
          toggle={toggle}
          isAdmin={isAdmin}
          onCreatePlaylist={() => onCreatePlaylist("sermons")}
          onSaved={onSaved}
        />
      )}

      {cat === "films" && (
        <PlaylistCategoryView
          category="films"
          kind="video"
          playlists={playlists}
          playlistTracks={playlistTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          playQueue={playQueue}
          toggle={toggle}
          isAdmin={isAdmin}
          onCreatePlaylist={() => onCreatePlaylist("films")}
          onSaved={onSaved}
        />
      )}

      {cat === "articles" && (
        <>
          <SearchBar query={query} setQuery={setQuery} placeholder="Rechercher un article…" />
          {fArticles.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {fArticles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucun article publié.</p>
          )}
        </>
      )}

      {cat === "youtube-culte" && (
        <YouTubeCategoryView
          section="culte"
          youtube={youtube}
          isAdmin={isAdmin}
          onSaved={onSaved}
        />
      )}

      {cat === "youtube-predication" && (
        <YouTubeCategoryView
          section="predication"
          youtube={youtube}
          isAdmin={isAdmin}
          onSaved={onSaved}
        />
      )}

      {cat === "gallery" && (
        <>
          {fGallery.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fGallery.map((g) => (
                <figure key={g.id} className="rounded-2xl overflow-hidden border border-border bg-card group">
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={g.image_url}
                      fittingType="fill"
                      className="w-full h-full group-hover:scale-105 transition"
                    />
                  </div>
                  {g.title && (
                    <figcaption className="p-2.5 text-xs font-semibold text-foreground/60 truncate">
                      {g.title}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Aucune image dans la galerie.</p>
          )}
        </>
      )}

      {cat === "playlist" && (
        <>
          <p className="text-sm text-foreground/55 mb-4">
            Ajoutez musique, prédications et vidéos depuis leurs catégories — votre playlist personnelle.
          </p>
          {playlist.length ? (
            <div className="space-y-3">
              {playlist.map((item) =>
                item.kind === "video" ? (
                  <div key={item.id} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
                        <Film className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{item.title}</div>
                        <div className="text-xs text-foreground/55">Vidéo</div>
                      </div>
                      <button
                        onClick={() => removeFromPlaylist(item.id)}
                        className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.video_url && (
                      <video
                        src={item.video_url}
                        controls
                        controlsList="nodownload"
                        disablePictureInPicture
                        className="w-full mt-3 rounded-xl max-h-72 bg-black"
                        poster={item.cover_url}
                      />
                    )}
                  </div>
                ) : (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <div className="h-12 w-12 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
                      <Music className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{item.title}</div>
                      <div className="text-xs text-foreground/55">{item.artist || "Audio"}</div>
                    </div>
                    <button
                      onClick={() => playPlaylistItem(item)}
                      className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center"
                    >
                      {currentTrack?.id === item.track_id && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => removeFromPlaylist(item.id)}
                      className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">
              Votre playlist est vide. Ajoutez des titres depuis Musique, Prédication ou Vidéos.
            </p>
          )}
        </>
      )}

      {cat === "playlists" && (
        <>
          {openPlaylist ? (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setOpenPlaylist(null)}
                  className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="font-display font-extrabold text-2xl truncate">
                  {openPlaylist.name}
                </h2>
              </div>
              {(() => {
                const pts = playlistTracks.filter(
                  (pt) => pt.playlist_id === openPlaylist.id
                );
                const audioPts = pts.filter(
                  (pt) => pt.kind !== "video" && pt.audio_url
                );
                if (!pts.length)
                  return (
                    <p className="text-foreground/50 text-sm">
                      Aucun titre dans cette playlist.
                    </p>
                  );
                return (
                  <div className="space-y-3">
                    {pts.map((pt) => (
                      <div
                        key={pt.id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                      >
                        <div className="h-12 w-12 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
                          <Music className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{pt.title}</div>
                          <div className="text-xs text-foreground/55">
                            {pt.artist || "Audio"}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const i = audioPts.findIndex((a) => a.id === pt.id);
                            if (i >= 0)
                              playQueue(
                                audioPts.map((a) => ({
                                  id: a.track_id,
                                  title: a.title,
                                  artist: a.artist,
                                  audio_url: a.audio_url,
                                  cover_url: a.cover_url,
                                })),
                                i
                              );
                          }}
                          className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center"
                        >
                          {currentTrack?.id === pt.track_id && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        {isAdmin && onRemovePlaylistTrack && (
                          <button
                            onClick={() => onRemovePlaylistTrack(pt.id)}
                            className="h-9 w-9 grid place-items-center rounded-full text-foreground/50 hover:text-destructive hover:bg-muted"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-extrabold text-2xl">Playlists</h2>
                {isAdmin && onCreatePlaylist && (
                  <button
                    onClick={() => onCreatePlaylist("other")}
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold hover:scale-105 transition"
                  >
                    <Plus className="h-4 w-4" /> Créer une playlist
                  </button>
                )}
              </div>
              {playlists.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {playlists.map((p) => {
                    const count = playlistTracks.filter(
                      (pt) => pt.playlist_id === p.id
                    ).length;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setOpenPlaylist(p)}
                        className="group rounded-[1.5rem] border border-border bg-card p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all"
                      >
                        <div className="aspect-square rounded-2xl brand-gradient grid place-items-center mb-3">
                          <Library className="h-8 w-8 text-white/90" />
                        </div>
                        <div className="font-bold text-sm line-clamp-1">{p.name}</div>
                        <div className="text-xs text-foreground/55">
                          {count} titre(s)
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-foreground/50 text-sm">
                  Aucune playlist pour le moment.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}