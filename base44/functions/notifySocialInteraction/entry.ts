import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Notifie l'auteur d'une publication qu'un like ou un commentaire a été reçu.
// S'exécute côté serveur en mode service (passe la RLS) pour que les
// notifications sociales ne nécessitent pas un "create" ouvert à tous sur
// l'entité UserNotification. L'acteur est vérifié via base44.auth.me() afin
// d'éviter l'usurpation d'identité.
//
// Payload attendu :
//   { action: "like" | "comment", post_id, author_id, actor_id, actor_name, text? }
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const postId = body.post_id;
    const actorId = body.actor_id;     // expéditeur de l'interaction
    const text = typeof body.text === 'string' ? body.text : '';

    if (!action || !postId || !actorId) {
      return Response.json({ error: 'missing fields' }, { status: 400 });
    }
    // L'acteur doit correspondre à l'utilisateur authentifié (anti-usurpation).
    if (actorId !== user.id) {
      return Response.json({ error: 'actor mismatch' }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    // Destinataire et nom déduits côté serveur : le client ne peut plus cibler
    // un utilisateur arbitraire (author_id) ni usurper un nom (actor_name) dans
    // le texte de notification.
    const post = await svc.entities.CommunityPost.get(postId).catch(() => null);
    if (!post) {
      return Response.json({ error: 'post not found' }, { status: 404 });
    }
    const authorId = post.created_by_id;
    const actorName =
      user.full_name ||
      (user.email ? user.email.split('@')[0] : "Quelqu'un");

    // On ne notifie pas l'auteur de sa propre interaction.
    if (authorId === actorId) {
      return Response.json({ skipped: 'self' });
    }

    if (action === 'like') {
      // Regroupe les likes rapprochés non lus sur le même post.
      const existing = await svc.entities.UserNotification.filter({
        user_id: authorId,
        type: 'like',
        post_id: postId,
        is_read: false,
      }).catch(() => []);
      const list = Array.isArray(existing) ? existing : [];
      const total = list.reduce((s, n) => s + (n.count || 1), 0) + 1;
      const firstActor = list[0]?.actor_name || actorName;
      const title =
        total > 1
          ? `${firstActor} et ${total - 1} autre${total - 1 > 1 ? 's' : ''} ont aimé votre publication`
          : `${actorName} a aimé votre publication`;

      if (list[0]) {
        await svc.entities.UserNotification.update(list[0].id, {
          count: total,
          title,
          actor_name: firstActor,
        });
      } else {
        await svc.entities.UserNotification.create({
          user_id: authorId,
          notification_id: `like_${postId}`,
          type: 'like',
          post_id: postId,
          actor_id: actorId,
          actor_name: actorName,
          count: 1,
          title,
          is_read: false,
        });
      }
      return Response.json({ ok: true, action: 'like', total });
    }

    if (action === 'comment') {
      const excerpt = text.slice(0, 40);
      await svc.entities.UserNotification.create({
        user_id: authorId,
        notification_id: `comment_${postId}_${Date.now()}`,
        type: 'comment',
        post_id: postId,
        actor_id: actorId,
        actor_name: actorName,
        count: 1,
        title: `${actorName} a commenté votre publication`,
        message: excerpt,
        is_read: false,
      });
      return Response.json({ ok: true, action: 'comment' });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}