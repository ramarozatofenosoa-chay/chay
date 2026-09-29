const RESOURCE_CATEGORIES = {
  musictrack: "music",
  music: "music",
  audio: "music",
  sermon: "sermons",
  predication: "sermons",
  video: "films",
  film: "films",
  youtubevideo: "youtube",
  youtube: "youtube",
  article: "articles",
  galleryimage: "gallery",
  gallery: "gallery",
};

function getResourceCategory(content) {
  const resourceType = content?.resource_type?.toLowerCase();
  const contentType = content?.type?.toLowerCase();
  return RESOURCE_CATEGORIES[resourceType] || RESOURCE_CATEGORIES[contentType] || null;
}

export function getContentMediaPath(content) {
  const resourceId = content?.resource_id;
  const category = getResourceCategory(content);
  if (!resourceId || !category) return null;

  const params = new URLSearchParams({ cat: category });
  if (category === "music" || category === "sermons" || category === "films") {
    params.set("track", resourceId);
    if (content.playlist_id) params.set("playlist", content.playlist_id);
  } else if (category === "youtube") {
    params.set("video", resourceId);
  } else if (category === "articles") {
    params.set("article", resourceId);
  } else if (category === "gallery") {
    params.set("image", resourceId);
  }

  return `/media?${params.toString()}`;
}
