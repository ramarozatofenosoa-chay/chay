import { base44 } from "@/api/base44Client";

// Nombre de contenus affichés dans la section « Nouveautés ».
export const NEW_CONTENTS_LIMIT = 10;

/**
 * Publie un contenu (statut published) puis déclenche la fonction backend
 * notifyNewContent : fan-out des notifications in-app (par lots, paginé) +
 * envoi des e-mails de nouveauté (si sendEmail est vrai). Idempotent par
 * contenu (notification_id "content_<id>").
 */
export async function publishContentWithNotification(data, { sendEmail = true } = {}) {
  const now = new Date().toISOString();
  const content = await base44.entities.Content.create({
    status: "published",
    published_at: now,
    ...data,
  });

  let fanout = { recipients: 0, created: 0, emailsSent: 0, emailsSkipped: 0 };
  try {
    const res = await base44.functions.invoke("notifyNewContent", {
      content_id: content.id,
      send_email: sendEmail,
    });
    fanout = (res && (res.data || res)) || fanout;
  } catch (e) {
    fanout.error = (e && e.message) || String(e);
  }

  return { content, ...fanout };
}