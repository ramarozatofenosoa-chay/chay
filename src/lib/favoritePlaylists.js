export function groupMusicFavorites(items) {
  const bySource = new Map();
  (Array.isArray(items) ? items : [])
    .filter((item) => (item.category || "music") === "music" && item.kind !== "video")
    .forEach((item) => {
      const id = item.source_playlist_id || "legacy-favorites";
      if (!bySource.has(id)) {
        bySource.set(id, {
          id,
          name: item.source_playlist_name || "Ma playlist",
          order: item.playlist_order ?? 99999,
          items: [],
        });
      }
      bySource.get(id).items.push(item);
    });

  return [...bySource.values()]
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999)),
    }))
    .sort((a, b) => a.order - b.order);
}
