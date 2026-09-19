import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Déclenché par le workflow "Message Push" à la création d'un message.
// Pour chaque participant (sauf l'expéditeur) :
//  - crée une notification in-app (UserNotification, type "message") → badge
//    + page Notifications ; la clé de déduplication "message_<id>_<uid>" garantit
//    une notification unique par message reçu et par destinataire ;
//  - envoie une notification push native (best effort ; nécessite un build mobile
//    natif, sans cela l'envoi échoue silencieusement).
// La notification n'est créée qu'après récupération du message persisté, donc
// uniquement si le message a bien été enregistré.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messageId = body.message_id;
    if (!messageId) {
      return Response.json({ error: 'message_id required' }, { status: 400 });
    }

    const message = await base44.asServiceRole.entities.Message
      .get(messageId)
      .catch(() => null);
    if (!message) {
      return Response.json({ error: 'message not found' }, { status: 404 });
    }

    const senderId = message.sender_id;
    const participants = Array.isArray(message.participant_ids)
      ? message.participant_ids
      : [];
    const targets = participants.filter((id) => id && id !== senderId);
    if (targets.length === 0) {
      return Response.json({ sent: 0 });
    }

    // Idempotence : on ne traite que les destinataires n'ayant pas déjà reçu
    // de notification pour ce message. Empêche tout rejeu anonyme de recréer
    // des notifications in-app et de renvoyer des push (anti-spam / quota).
    const notifIds = targets.map((uid) => `message_${message.id}_${uid}`);
    const existing = await base44.asServiceRole.entities.UserNotification
      .filter({ notification_id: { $in: notifIds } })
      .catch(() => []);
    const done = new Set(
      (Array.isArray(existing) ? existing : []).map((n) => n.notification_id)
    );
    const pending = targets.filter(
      (uid) => !done.has(`message_${message.id}_${uid}`)
    );
    if (pending.length === 0) {
      return Response.json({ sent: 0, skipped: 'already_notified' });
    }

    const senderName = message.sender_name || 'Quelqu\'un';
    const isImageOnly = !message.text && !!message.image_url;
    // Aperçu sécurisé : 100 caractères max, jamais de contenu brut négatif.
    const preview = message.text ? String(message.text).slice(0, 100) : '';
    const title = isImageOnly
      ? 'Vous avez reçu une photo'
      : `${senderName} vous a envoyé un message`;
    const notifBody = isImageOnly
      ? `${senderName} vous a envoyé une photo`
      : preview;

    let notifCreated = 0;
    let pushSent = 0;

    for (const uid of pending) {
      // Notification in-app (badge + page Notifications). content_id porte
      // l'identifiant de la conversation pour ouvrir directement le bon fil.
      try {
        await base44.asServiceRole.entities.UserNotification.create({
          user_id: uid,
          notification_id: `message_${message.id}_${uid}`,
          type: 'message',
          content_id: message.conversation_id,
          content_type: 'message',
          post_id: null,
          actor_id: senderId,
          actor_name: senderName,
          count: 1,
          title,
          message: notifBody,
          is_read: false,
        });
        notifCreated += 1;
      } catch {}

      // Push natif (best effort).
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: uid,
          title,
          content: notifBody,
          action_label: 'Ouvrir',
          action_url: '/messages?c=' + message.conversation_id,
        });
        pushSent += 1;
      } catch {}
    }

    return Response.json({ notifCreated, pushSent, total: pending.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}