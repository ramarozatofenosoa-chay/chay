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
