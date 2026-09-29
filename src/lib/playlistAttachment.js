export function buildPlaylistTrackRecord({
  entity,
  playlistId,
  item,
  submittedData = {},
  coverField = "cover_url",
}) {
  if (!item?.id || !playlistId) {
    throw new Error("Un identifiant de contenu et de playlist est requis.");
  }

  return {
    playlist_id: playlistId,
    track_id: item.id,
    title: item.title || submittedData.title,
    artist: item.artist || item.speaker || submittedData.artist || submittedData.speaker || null,
    audio_url: item.audio_url || submittedData.audio_url || null,
    video_url: item.video_url || submittedData.video_url || null,
    cover_url:
      item[coverField] ||
      submittedData[coverField] ||
      item.cover_url ||
      submittedData.cover_url ||
      null,
    kind: entity === "Video" ? "video" : "audio",
    order: Date.now(),
  };
}

export function resolveSelectedPlaylistId(selectedPlaylistId, submittedPlaylistId) {
  return selectedPlaylistId === null ? submittedPlaylistId : selectedPlaylistId;
}

export async function savePlaylistTrack(entity, record, mediaField) {
  const created = await entity.create(record);
  if (!created?.id) {
    throw new Error("Base44 n'a pas confirmé l'ajout du contenu à la playlist.");
  }

  const requiredFields = ["playlist_id", "track_id", "title", mediaField];
  let persisted = await entity.get(created.id);
  let missingFields = requiredFields.filter(
    (field) => persisted?.[field] !== record[field]
  );
  if (!missingFields.length) return persisted;

  const updated = await entity.update(
    persisted?.id || created.id,
    Object.fromEntries(missingFields.map((field) => [field, record[field]]))
  );
  persisted = await entity.get(updated?.id || created.id);
  const stillMissing = requiredFields.filter(
    (field) => persisted?.[field] !== record[field]
  );
  if (stillMissing.length) {
    throw new Error(
      `Base44 n'a pas enregistré le lien playlist (${stillMissing.join(", ")}). Vérifiez les champs de l'entité PlaylistTrack, puis publiez.`
    );
  }
  return persisted;
}
