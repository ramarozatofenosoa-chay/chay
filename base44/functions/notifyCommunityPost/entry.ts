import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

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

    // Auth : admin, auteur du post, OU appel interne (workflow) prouvé par secret.
    let caller = null;
    try { caller = await base44.auth.me(); } catch {}
    const isInternal = body.internal_secret && body.internal_secret === secrets.get("INTERNAL_INVOKE_SECRET");
    const isAuthor = caller && caller.id === post.created_by_id;
    const isAdmin = caller && caller.role === "admin";
    if (!isAdmin && !isAuthor && !isInternal) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const authorName = post.author_name || 'Un membre';
    const excerpt = (post.text || '').slice(0, 80);
    const title = `${authorName} a publié dans la communauté`;
    const notifId = `community_${post.id}`;
    const authorId = post.created_by_id || body.author_id;


    // Idempotence : si les notifications pour ce post ont déjà été créées
    // (par le workflow à la création), on sort immédiatement. Cela neutralise
    // tout rejeu anonyme de l'endpoint HTTP (pas de spam ni de croissance BDD).
    const already = await base44.asServiceRole.entities.UserNotification
      .filter({ notification_id: notifId }, null, 1)
      .catch(() => []);
    if (Array.isArray(already) && already.length > 0) {
      return Response.json({ skipped: 'already_notified' });
    }

    // Récupère tous les utilisateurs par pagination (cap de sécurité 5000).
    const rows = [];
    const pushIds = [];
    let skip = 0;
    while (skip < 5000) {
      const batch = await base44.asServiceRole.entities.User
        .list('-created_date', 500, skip);
      const arr = Array.isArray(batch) ? batch : [];
      for (const u of arr) {
        if (u.id === authorId) continue;
        const prefs = u.settings || {};
        // Préférence générale : notifications coupées → pas de notification.
        if (prefs.notifications_enabled === false || prefs.notif_news === false) continue;
        if (prefs.notif_push !== false) pushIds.push(u.id);
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
    let createFailed = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      try {
        const res = await base44.asServiceRole.entities.UserNotification.bulkCreate(chunk);
        created += Array.isArray(res) ? res.length : 0;
      } catch (error) {
        createFailed += chunk.length;
        console.error("[notifyCommunityPost] Création des notifications impossible.", {
          offset: i,
          error: error?.message || String(error),
        });
      }
    }

    let pushSent = 0;
    let pushFailed = 0;
    if (pushIds.length) {
      try {
        const result = await base44.asServiceRole.functions.invoke("sendFcmPush", {
          user_ids: pushIds,
          title,
          body: excerpt || title,
          target_type: "community",
          target_id: post.id,
          internal_secret: secrets.get("INTERNAL_INVOKE_SECRET"),
        });
        const data = result?.data || result;
        pushSent = (data?.sent || 0) + (data?.webPush?.sent || 0);
        pushFailed = (data?.failed || 0) + (data?.webPush?.failed || 0);
        if (data?.webPush?.skipped && !(data?.sent > 0)) {
          pushFailed = Math.max(pushFailed, pushIds.length);
          console.error("[notifyCommunityPost] Push non disponible.", data.webPush.skipped);
        }
        if (data?.fcmError && !(data?.webPush?.sent > 0)) {
          pushFailed = Math.max(pushFailed, pushIds.length);
          console.error("[notifyCommunityPost] Configuration FCM invalide.", data.fcmError);
        }
      } catch (error) {
        pushFailed = pushIds.length;
        console.error("[notifyCommunityPost] Envoi push impossible.", error?.message || String(error));
      }
    }

    return Response.json({ recipients: rows.length, created, createFailed, pushSent, pushFailed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
