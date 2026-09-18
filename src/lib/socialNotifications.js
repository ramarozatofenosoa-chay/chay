import { base44 } from "@/api/base44Client";

// Prénom lisible d'un utilisateur.
function firstName(user) {
  return (
    user?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Quelqu'un")
  ).trim();
}

/**
 * Notifie l'auteur d'une publication qu'un like a été reçu, via la fonction
 * backend notifySocialInteraction (mode service) — la RLS de UserNotification
 * n'autorise plus la création côté client.
 */
export async function notifyLike(post, actor) {
  if (!post?.created_by_id || !actor?.id || post.created_by_id === actor.id) return;
  try {
    await base44.functions.invoke("notifySocialInteraction", {
      action: "like",
      post_id: post.id,
      author_id: post.created_by_id,
      actor_id: actor.id,
      actor_name: firstName(actor),
    });
  } catch {
    /* ignore */
  }
}

/**
 * Notifie l'auteur d'une publication qu'un commentaire a été reçu.
 */
export async function notifyComment(post, actor, text) {
  if (!post?.created_by_id || !actor?.id || post.created_by_id === actor.id) return;
  try {
    await base44.functions.invoke("notifySocialInteraction", {
      action: "comment",
      post_id: post.id,
      author_id: post.created_by_id,
      actor_id: actor.id,
      actor_name: firstName(actor),
      text: text || "",
    });
  } catch {
    /* ignore */
  }
}