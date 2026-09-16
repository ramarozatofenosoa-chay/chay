import { base44 } from "@/api/base44Client";

// Prénom lisible d'un utilisateur.
function firstName(user) {
  return (
    user?.first_name ||
    user?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Quelqu'un")
  ).trim();
}

/**
 * Notifie l'auteur d'une publication qu'un like a été reçu.
 * Regroupe les likes rapprochés sur la même publication :
 * "[Prénom] a aimé votre publication" puis "[Prénom] et N autres ont aimé…".
 */
export async function notifyLike(post, actor) {
  if (!post?.created_by_id || !actor?.id || post.created_by_id === actor.id) return;
  try {
    const existing = await base44.entities.UserNotification.filter({
      user_id: post.created_by_id,
      type: "like",
      post_id: post.id,
      is_read: false,
    });
    const list = Array.isArray(existing) ? existing : [];
    const total = list.reduce((s, n) => s + (n.count || 1), 0) + 1;
    const firstActor = list[0]?.actor_name || firstName(actor);
    const title =
      total > 1
        ? `${firstActor} et ${total - 1} autre${total - 1 > 1 ? "s" : ""} ont aimé votre publication`
        : `${firstName(actor)} a aimé votre publication`;

    if (list[0]) {
      await base44.entities.UserNotification.update(list[0].id, {
        count: total,
        title,
        actor_name: firstActor,
      });
    } else {
      await base44.entities.UserNotification.create({
        user_id: post.created_by_id,
        notification_id: `like_${post.id}`,
        type: "like",
        post_id: post.id,
        actor_id: actor.id,
        actor_name: firstName(actor),
        count: 1,
        title,
        is_read: false,
      });
    }
  } catch {
    /* ignore */
  }
}

/**
 * Notifie l'auteur d'une publication qu'un commentaire a été reçu,
 * avec un extrait tronqué à 40 caractères.
 */
export async function notifyComment(post, actor, text) {
  if (!post?.created_by_id || !actor?.id || post.created_by_id === actor.id) return;
  try {
    const excerpt = (text || "").slice(0, 40);
    await base44.entities.UserNotification.create({
      user_id: post.created_by_id,
      notification_id: `comment_${post.id}_${Date.now()}`,
      type: "comment",
      post_id: post.id,
      actor_id: actor.id,
      actor_name: firstName(actor),
      count: 1,
      title: `${firstName(actor)} a commenté votre publication`,
      message: excerpt,
      is_read: false,
    });
  } catch {
    /* ignore */
  }
}