import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import EntityForm from "@/components/admin/EntityForm";
import CreatePlaylistModal from "@/components/media/CreatePlaylistModal";

export default function EntityCrud({
  entity,
  fields,
  listColumns,
  sort,
  readOnly,
  detailField,
  emptyLabel,
  thumbField,
  showPlaylist = false,
}) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

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
      const list = await base44.entities.Playlist.list("-created_date", 50);
      setPlaylists(Array.isArray(list) ? list : []);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (showPlaylist && open) {
      loadPlaylists();
    }
  }, [open, showPlaylist]);

  // Build fields with playlist selector if needed
  const allFields = showPlaylist
    ? [
        {
          name: "playlist_id",
          label: "Playlist",
          type: "select",
          required: true,
          options: [
            { value: "__new__", label: "➕ Créer une nouvelle playlist" },
            ...playlists.map((p) => ({
              value: p.id,
              label: p.name,
            })),
          ],
        },
        ...fields,
      ]
    : fields;

  const submit = async (data) => {
    setSaving(true);
    try {
      let playlistId = data.playlist_id;

      // Si "Créer une playlist" est sélectionné, ouvrir le modal
      // Le formulaire reste ouvert — l'admin crée la playlist, puis la sélectionne
      if (playlistId === "__new__") {
        toast({ title: "Créez d'abord une playlist" });
        setShowCreatePlaylist(true);
        setSaving(false);
        return;
      }

      // Créer le contenu
      let createdItem;
      if (editing) {
        createdItem = await base44.entities[entity].update(editing.id, data);
        toast({ title: "Mis à jour" });
      } else {
        createdItem = await base44.entities[entity].create(data);
        toast({ title: "Créé" });
      }

      // Ajouter à la playlist si sélectionnée
      if (playlistId && createdItem.id) {
        try {
          await base44.entities.PlaylistTrack.create({
            playlist_id: playlistId,
            track_id: createdItem.id,
            title: createdItem.title,
            artist: createdItem.artist || null,
            audio_url: createdItem.audio_url || null,
            video_url: createdItem.video_url || null,
            cover_url: createdItem.cover_url || null,
            kind: entity === "MusicTrack" ? "audio" : entity === "Video" ? "video" : "audio",
            order: Date.now(),
          });
        } catch (e) {
          toast({ title: "Attention", description: "Contenu créé mais n'a pas pu être ajouté à la playlist", variant: "default" });
        }
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

  const handlePlaylistCreated = (newPlaylist) => {
    setNewPlaylistId(newPlaylist.id);
    // Re-ouvrir le formulaire avec la nouvelle playlist pré-sélectionnée
    setShowCreatePlaylist(false);
    setOpen(true);
    // Mettre à jour les playlists
    loadPlaylists();
  };

  const remove = async (item) => {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      await base44.entities[entity].delete(item.id);
      toast({ title: "Supprimé" });
      load();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{items.length} élément(s)</p>
        {!readOnly && (
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:scale-105 transition"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        )}
      </div>

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
            fields={allFields}
            initial={editing}
            onSubmit={submit}
            onCancel={() => setOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Modal pour créer une nouvelle playlist */}
      <CreatePlaylistModal
        open={showCreatePlaylist}
        onOpenChange={(v) => {
          setShowCreatePlaylist(v);
          if (!v) {
            // Si on ferme sans créer, remettre le formulaire ouvert
            setOpen(true);
          }
        }}
        onSaved={(newPlaylist) => {
          handlePlaylistCreated(newPlaylist);
        }}
        category={entity === "MusicTrack" ? "music" : entity === "Sermon" ? "sermons" : "films"}
      />
    </div>
  );
}
