import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Music } from "lucide-react";
import { Image } from "@/components/ui/image";
import EntityForm from "@/components/admin/EntityForm";
import CreatePlaylistModal from "@/components/media/CreatePlaylistModal";

const PLAYLIST_CATEGORY = {
  MusicTrack: "music",
  Sermon: "sermons",
  Video: "films",
};

export default function EntityCrud({
  entity,
  fields,
  listColumns,
  sort,
  readOnly,
  detailField,
  emptyLabel,
  thumbField,
  playlistField = "cover_url",
  showPlaylist = false,
}) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  // Clé du formulaire : changer la clé remonte EntityForm avec les bonnes valeurs.
  const [formKey, setFormKey] = useState("new");
  // Playlist créée pendant que le formulaire est ouvert : on la pré-sélectionne.
  const pendingSelectRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const res = await base44.entities[entity]
      .list(sort || "-created_date", 50)
      .catch(() => []);
    setItems(Array.isArray(res) ? res : []);
    setLoading(false);
  };

  const loadPlaylists = async () => {
    try {
      const list = await base44.entities.Playlist.list("-created_date", 100);
      const arr = Array.isArray(list) ? list : [];
      // Tri du plus récent au plus ancien.
      arr.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      const cat = PLAYLIST_CATEGORY[entity];
      setPlaylists(cat ? arr.filter((p) => (p.category || "music") === cat) : arr);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (showPlaylist) {
      loadPlaylists();
    }
  }, [showPlaylist]);

  // Champ "Playlist" : obligatoire à la création, optionnel en modification
  // (permet de retirer un contenu de sa playlist sans le supprimer).
  const allFields = showPlaylist
    ? [
        {
          name: "playlist_id",
          label: "Playlist",
          type: "select",
          required: !editing,
          options: [
            ...(editing ? [{ value: "", label: "— Aucune (retirer de la playlist)" }] : []),
            ...playlists.map((p) => ({
              value: p.id,
              label: p.name,
            })),
          ],
        },
        ...fields,
      ]
    : fields;

  const attachToPlaylist = async (createdItem, playlistId) => {
    if (!createdItem?.id || !playlistId) return;
    try {
      const existing = await base44.entities.PlaylistTrack.list(
        `-playlist_id eq "${playlistId}"`,
        200
      ).catch(() => []);
      const already = (Array.isArray(existing) ? existing : []).find(
        (pt) => pt.track_id === createdItem.id && pt.playlist_id === playlistId
      );
      if (already) {
        if (editing)
          await base44.entities.PlaylistTrack.update(already.id, {
            title: createdItem.title,
            artist: createdItem.artist || createdItem.speaker || null,
            audio_url: createdItem.audio_url || null,
            video_url: createdItem.video_url || null,
            cover_url: createdItem[playlistField] || createdItem.cover_url || null,
          });
        return;
      }
      await base44.entities.PlaylistTrack.create({
        playlist_id: playlistId,
        track_id: createdItem.id,
        title: createdItem.title,
        artist: createdItem.artist || createdItem.speaker || null,
        audio_url: createdItem.audio_url || null,
        video_url: createdItem.video_url || null,
        cover_url: createdItem[playlistField] || createdItem.cover_url || null,
        kind: entity === "Video" ? "video" : "audio",
        order: Date.now(),
      });
    } catch (e) {
      toast({
        title: "Attention",
        description: "Contenu enregistré mais n'a pas pu être ajouté à la playlist.",
      });
    }
  };

  const detachFromPlaylists = async (itemId) => {
    try {
      const pts = await base44.entities.PlaylistTrack.list("-created_date", 200);
      const arr = Array.isArray(pts) ? pts : [];
      await Promise.all(
        arr
          .filter((pt) => pt.track_id === itemId)
          .map((pt) => base44.entities.PlaylistTrack.delete(pt.id).catch(() => {}))
      );
    } catch {}
  };

  const submit = async (data) => {
    setSaving(true);
    try {
      const { playlist_id, ...rest } = data;

      let createdItem;
      if (editing) {
        createdItem = await base44.entities[entity].update(editing.id, rest);
        toast({ title: "Mis à jour" });
        // Retirer les liens existants puis re-lier à la playlist choisie (ou aucune)
        await detachFromPlaylists(editing.id);
        await attachToPlaylist(createdItem, playlist_id);
      } else {
        rest.created_by_admin = true;
        createdItem = await base44.entities[entity].create(rest);
        toast({ title: "Créé" });
        await attachToPlaylist(createdItem, playlist_id);
      }

      setOpen(false);
      await load();
      await loadPlaylists();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePlaylistCreated = async (newPlaylist) => {
    setShowCreatePlaylist(false);
    await loadPlaylists();
    // Si le formulaire d'ajout est ouvert, pré-sélectionner la nouvelle playlist.
    if (newPlaylist?.id && open) {
      pendingSelectRef.current = newPlaylist.id;
      setFormKey((k) => `${k}-pl-${newPlaylist.id}`);
    }
  };

  const removePlaylist = async (playlist) => {
    if (
      !confirm(
        `Supprimer la playlist « ${playlist.name} » ? Les contenus qu'elle contient seront aussi supprimés.`
      )
    )
      return;
    try {
      const pts = await base44.entities.PlaylistTrack.list(
        `-playlist_id eq "${playlist.id}"`,
        500
      ).catch(() => []);
      const arr = Array.isArray(pts) ? pts : [];
      // Supprimer les contenus liés selon l'entité de la section.
      const contentEntity = entity;
      for (const pt of arr) {
        await base44.entities[contentEntity].delete(pt.track_id).catch(() => {});
        await base44.entities.PlaylistTrack.delete(pt.id).catch(() => {});
      }
      await base44.entities.Playlist.delete(playlist.id);
      toast({ title: "Playlist supprimée" });
      await load();
      await loadPlaylists();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (item) => {
    if (!confirm("Supprimer cet élément ? Il sera aussi retiré de toutes les playlists.")) return;
    try {
      await detachFromPlaylists(item.id);
      await base44.entities[entity].delete(item.id);
      toast({ title: "Supprimé" });
      load();
      loadPlaylists();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{items.length} élément(s)</p>
        {!readOnly && (
          <div className="flex gap-2">
            {showPlaylist && (
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-muted transition"
              >
                <Plus className="h-4 w-4" /> Créer une nouvelle playlist
              </button>
            )}
            <button
              onClick={() => {
                setEditing(null);
                pendingSelectRef.current = null;
                setFormKey("new");
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:scale-105 transition"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
        )}
      </div>

      {showPlaylist && isAdmin && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Playlists ({playlists.length})
          </p>
          {playlists.length === 0 ? (
            <p className="text-sm text-foreground/50">
              Aucune playlist. Utilisez « Créer une nouvelle playlist ».
            </p>
          ) : (
            <div className="space-y-2">
              {playlists.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-muted ring-1 ring-border grid place-items-center brand-gradient">
                    {p.cover_url ? (
                      <Image src={p.cover_url} fittingType="fill" className="w-full h-full" />
                    ) : (
                      <Music className="h-4 w-4 text-white/90" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.created_date || Date.now()).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <button
                    onClick={() => removePlaylist(p)}
                    className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-destructive shrink-0"
                    title="Supprimer la playlist et ses contenus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-foreground/50 py-8">
          {emptyLabel || "Aucun élément."}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              {thumbField && item[thumbField] && (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-muted ring-1 ring-border">
                  <Image
                    src={item[thumbField]}
                    fittingType="fill"
                    className="h-full w-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">
                  {listColumns.map((c) => item[c]).filter(Boolean).join(" · ") ||
                    "Sans titre"}
                </div>
                {detailField && item[detailField] && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item[detailField]}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(item.created_date || item.updated_date).toLocaleDateString(
                    "fr-FR"
                  )}
                </div>
              </div>
              {!readOnly && (
                <>
                  <button
                    onClick={() => {
                      setEditing(item);
                      pendingSelectRef.current = null;
                      setFormKey(`edit-${item.id}`);
                      setOpen(true);
                    }}
                    className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier" : "Ajouter"}</DialogTitle>
          </DialogHeader>
          <EntityForm
            key={formKey}
            fields={allFields}
            initial={{ ...(editing || {}), ...(pendingSelectRef.current ? { playlist_id: pendingSelectRef.current } : {}) }}
            onSubmit={submit}
            onCancel={() => setOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Modale de création de playlist — fonctionne depuis la liste comme
          depuis le formulaire (bouton vert dans le champ Playlist). */}
      <CreatePlaylistModal
        open={showCreatePlaylist}
        onOpenChange={(v) => setShowCreatePlaylist(v)}
        onSaved={(newPlaylist) => {
          handlePlaylistCreated(newPlaylist);
        }}
        category={PLAYLIST_CATEGORY[entity] || "other"}
      />
    </div>
  );
}
