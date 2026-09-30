import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Création de message sécurisée : authentification obligatoire,
// participants et identité de l'expéditeur forcés côté serveur.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try { caller = await base44.auth.me(); } catch {}
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const conversationId = body.conversation_id;
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const imageUrl = typeof body.image_url === "string" ? body.image_url : "";
    const replyToId = typeof body.reply_to_id === "string" ? body.reply_to_id : null;
    if (!conversationId || (!text && !imageUrl)) {
      return Response.json({ error: "conversation_id et text ou image_url requis" }, { status: 400 });
    }

    const conversation = await base44.asServiceRole.entities.Conversation
      .get(conversationId).catch(() => null);
    if (!conversation) return Response.json({ error: "conversation not found" }, { status: 404 });

    const participants = Array.isArray(conversation.participant_ids) ? conversation.participant_ids : [];
    if (!participants.includes(caller.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const myName = caller.full_name
      || [caller.first_name, caller.last_name].filter(Boolean).join(" ")
      || "Membre";
    const message = await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      participant_ids: participants,
      sender_id: caller.id,
      sender_name: myName,
      text,
      image_url: imageUrl || null,
      reply_to_id: replyToId,
      read_by: [caller.id],
      created_by_id: caller.id,
    });

    // Notifications (appel interne — secret lu au runtime, jamais côté client).
    // sendMessagePush est idempotent (dédupe via notification_id), donc un
    // échec transitoire (réseau, cold start) peut être retenté sans risque de
    // double notification. Sans retry, un seul échec faisait perdre la
    // notification/push du destinataire de façon définitive et silencieuse.
    const MAX_ATTEMPTS = 3;
    let notificationError = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const result = await base44.asServiceRole.functions.invoke("sendMessagePush", {
          message_id: message.id,
          internal_secret: secrets.get("INTERNAL_INVOKE_SECRET"),
        });
        const dispatch = result?.data || result;
        if (dispatch?.error) {
          notificationError = String(dispatch.error);
        } else if (dispatch?.notifFailed > 0) {
          notificationError = "notification_creation_failed";
        } else if (dispatch?.pushFailed > 0) {
          notificationError = "push_delivery_failed";
        } else if (dispatch?.pushNoSubscriptions > 0) {
          notificationError = "no_push_subscription";
        } else if (dispatch?.webPushSkipped && !(dispatch?.pushSent > 0)) {
          notificationError = String(dispatch.webPushSkipped);
        } else if (dispatch?.fcmError && !(dispatch?.webPushSent > 0)) {
          notificationError = String(dispatch.fcmError);
        } else {
          notificationError = null;
        }
      } catch (error) {
        notificationError = error?.message || String(error);
      }
      if (!notificationError) break;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      }
    }
    if (notificationError) {
      console.error("[createMessage] Message enregistré, mais notifications échouées après plusieurs tentatives.", {
        messageId: message.id,
        error: notificationError,
        attempts: MAX_ATTEMPTS,
      });
    }

    return Response.json({ id: message.id, notification_error: notificationError });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
