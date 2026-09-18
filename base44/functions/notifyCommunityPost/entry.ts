import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Déclenché par le workflow "Community Post Notification" à la création
// d'une publication (CommunityPost). Crée une notification in-app
// (UserNotification) pour TOUS les utilisateurs (sauf l'auteur), afin que
// chacun voie une notification « Nouvelle publication dans la communauté ».
// La pagination gère plus de 1000 utilisateurs (par lots de 500).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const postId = body.post_id;
    if (!postId) {
      return Response.json({ error: 'post_id required' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.CommunityPost
      .get(postId)
      .catch(() => null);
    if (!post) {
      return Response.json({ error: 'post not found' }, { status: 404 });
    }

    const authorName = post.author_name || 'Un membre';
    const excerpt = (post.text || '').slice(0, 80);
    const title = `${authorName} a publié dans la communauté`;
    const notifId = `community_${post.id}`;
    const authorId = post.created_by_id;

    // Récupère tous les utilisateurs par pagination (cap de sécurité 5000).
    const rows = [];
    let skip = 0;
    while (skip < 5000) {
      const batch = await base44.asServiceRole.entities.User
        .list('-created_date', 500, skip)
        .catch(() => []);
      const arr = Array.isArray(batch) ? batch : [];
      for (const u of arr) {
        if (u.id === authorId) continue;
        rows.push({
          user_id: u.id,
          notification_id: notifId,
          type: 'community_post',
          post_id: post.id,
          actor_id: authorId,
          actor_name: authorName,
          count: 1,
          title,
          message: excerpt,
          is_read: false,
        });
      }
      if (arr.length < 500) break;
      skip += 500;
    }

    // Création par lots de 500.
    let created = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      try {
        const res = await base44.asServiceRole.entities.UserNotification.bulkCreate(chunk);
        created += Array.isArray(res) ? res.length : 0;
      } catch {}
    }

    return Response.json({ recipients: rows.length, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}