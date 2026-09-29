import { base44 } from "@/api/base44Client";

// Upload centralisé. Historiquement l'app appelait Core.UploadPublicFile, un
// endpoint inexistant côté Base44 : le SDK (proxy dynamique) l'envoyait quand
// même et le serveur répondait lentement/incorrectement → imports d'audio qui
// prenaient ~1 minute, URL de couverture jamais reçue (icône par défaut),
// musiques importées mais illisibles.
// Seule l'API officielle du SDK est utilisée ici : Core.UploadFile, qui
// renvoie directement { file_url }.

const pickUrl = (res) => {
  if (!res) return null;
  if (typeof res === "string") return /^https?:\/\//i.test(res) ? res : null;
  const url =
    res.file_url || res.url || res.uri || res.data?.file_url || res.data?.url || null;
  return url && /^https?:\/\//i.test(url) ? url : null;
};

export async function uploadToBase44(file) {
  const res = await base44.integrations.Core.UploadFile({ file });
  const url = pickUrl(res);
  if (!url) {
    throw new Error(
      "Échec du téléversement : réponse d'upload inattendue (" +
        JSON.stringify(res)?.slice(0, 120) +
        ")"
    );
  }
  return url;
}
