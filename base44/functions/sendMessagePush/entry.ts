import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Déclenché par le workflow "Message Push" à la création d'un message.
// Pour chaque participant (sauf l'expéditeur) :
//  - crée une notification in-app (UserNotification) → badge + page Notifications,
//  - envoie une notification push native (nécessite un build mobile natif ;
//    sans cela l'envoi échoue silencieusement).
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

    const senderName = message.sender_name || "Quelqu'un";
    const content = message.text ? message.text : '📷 Photo';
    const actionUrl = '/messages?c=' + message.conversation_id;

    let notifCreated = 0;
    let pushSent = 0;

    for (const uid of targets) {
      // Notification in-app (badge + page Notifications).
      try {
        await base44.asServiceRole.entities.UserNotification.create({
          user_id: uid,
          notification_id: `message_${message.id}_${uid}`,
          type: 'message',
          post_id: null,
          actor_id: senderId,
          actor_name: senderName,
          count: 1,
          title: senderName,
          message: content.slice(0, 80),
          is_read: false,
        });
        notifCreated += 1;
      } catch {}

      // Push natif (best effort).
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: uid,
          title: senderName,
          content,
          action_label: 'Ouvrir',
          action_url: actionUrl,
        });
        pushSent += 1;
      } catch {}
    }

    return Response.json({ notifCreated, pushSent, total: targets.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}