export function getHomeContentMessage(item) {
  const title = item?.title || "";
  switch (item?.type) {
    case "audio":
      return `La chanson "${title}" a été ajoutée récemment.`;
    case "predication":
      return `La prédication "${title}" a été ajoutée récemment.`;
    case "video":
      return `Le film "${title}" a été ajouté récemment.`;
    case "youtube":
      return `La vidéo YouTube "${title}" a été ajoutée récemment.`;
    case "article":
      return `L'article "${title}" a été ajoutée récemment.`;
    case "gallery":
      return "Une nouvelle photo a été ajoutée dans la galerie.";
    default:
      return title ? `Un nouveau contenu "${title}" a été ajouté récemment.` : "Un nouveau contenu a été ajouté récemment.";
  }
}
