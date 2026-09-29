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
    try {
      await base44.asServiceRole.functions.invoke("sendMessagePush", {
        message_id: message.id,
        internal_secret: secrets.get("INTERNAL_INVOKE_SECRET"),
      });
    } catch {}

    return Response.json({ id: message.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
