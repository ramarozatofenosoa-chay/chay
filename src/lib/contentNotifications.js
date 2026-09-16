import { base44 } from "@/api/base44Client";

// Nombre de contenus affichés dans la section « Nouveautés ».
export const NEW_CONTENTS_LIMIT = 10;

/**
 * Publie un contenu et déclenche automatiquement :
 *  - la création d'une notification (type new_content),
 *  - la création d'une ligne UserNotification (non lue) pour chaque utilisateur.
 * Réutilise l'authentification et les entités existantes — pas de système parallèle.
 */
export async function publishContentWithNotification(data) {
  const now = new Date().toISOString();
  const payload = {
    status: "published",
    published_at: now,
    ...data,
  };

  const content = await base44.entities.Content.create(payload);

  const notif = await base44.entities.AppNotification.create({
    type: "new_content",
    title: `Nouveau contenu : ${content.title}`,
    message: content.description || "",
    content_id: content.id,
    content_type: content.type,
    thumbnail_url: content.thumbnail_url || "",
  });

  // Cible : tous les utilisateurs (l'admin peut lister les users).
  const users = await base44.entities.User.list("-created_date", 1000);
  const userList = Array.isArray(users) ? users : [];

  const rows = userList.map((u) => ({
    user_id: u.id,
    notification_id: notif.id,
    type: "new_content",
    content_id: content.id,
    title: notif.title,
    message: notif.message,
    thumbnail_url: notif.thumbnail_url,
    content_type: content.type,
    is_read: false,
  }));

  // bulkCreate par lots de 500.
  for (let i = 0; i < rows.length; i += 500) {
    await base44.entities.UserNotification.bulkCreate(rows.slice(i, i + 500));
  }

  return { content, notif, recipients: rows.length };
}