import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Déclenché par le workflow "Message Push" à la création d'un message.
// Envoie une notification push native à chaque participant (sauf l'expéditeur).
// NOTE: la délivrance réelle nécessite un build mobile natif (iOS/Android) avec
// les identifiants push configurés ; sans cela l'envoi échoue silencieusement.
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

    const results = [];
    for (const uid of targets) {
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: uid,
          title: senderName,
          content,
          action_label: 'Ouvrir',
          action_url: actionUrl,
        });
        results.push({ uid, ok: true });
      } catch (e) {
        results.push({ uid, ok: false, error: e?.message || 'failed' });
      }
    }

    return Response.json({
      sent: results.filter((r) => r.ok).length,
      total: targets.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}