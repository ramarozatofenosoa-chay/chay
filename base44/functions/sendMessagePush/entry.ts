import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Déclenché par le workflow "Message Push" à la création d'un message.
// Pour chaque participant (sauf l'expéditeur) :
//  - crée une notification in-app (UserNotification, type "message") SAUF si la
//    conversation est actuellement ouverte par le destinataire (MemberProfile)
//    et que in_app_messages est activé ;
//  - envoie un e-mail (si email_messages activé) avec déduplication 30 min par
//    conversation/destinataire et skip si le message a déjà été lu ;
//  - envoie un push natif (best effort).
// Idempotent via notification_id "message_<id>_<uid>".
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const EMAIL_DEDUP_MS = 30 * 60 * 1000;
const APP_URL = "https://chay.base44.app";
const AMP = String.fromCharCode(38);

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, AMP + "amp;")
    .replace(/</g, AMP + "lt;")
    .replace(/>/g, AMP + "gt;")
    .replace(/"/g, AMP + "quot;")
    .replace(/'/g, AMP + "#39;");
}

function messageEmailHtml(senderName, preview, conversationId) {
  const cta = APP_URL + "/messages?c=" + encodeURIComponent(conversationId || "");
  const body =
    "<p style=\"margin:0 0 8px;font-size:15px;color:#3f3f46;\"><strong>" + escapeHtml(senderName) + "</strong> vous a envoyé un message.</p>" +
    "<p style=\"margin:0 0 8px;font-size:15px;color:#3f3f46;border-left:3px solid #8A56E2;padding-left:12px;\">" + escapeHtml(preview) + "</p>" +
    "<a href=\"" + cta + "\" style=\"display:inline-block;margin-top:18px;background:linear-gradient(100deg,#4A6CFE 0%,#8A56E2 50%,#FF57B2 100%);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px;\">Ouvrir la conversation</a>";
  return shellHtml("Nouveau message", body);
}

function shellHtml(title, body) {
  return "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>" +
    "<body style=\"margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">" +
    "<div style=\"max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e4e4e7;\">" +
    "<div style=\"background:linear-gradient(100deg,#4A6CFE 0%,#8A56E2 50%,#FF57B2 100%);padding:24px 32px;color:#fff;font-size:20px;font-weight:800;\">Église Chay</div>" +
    "<div style=\"padding:28px 32px;\"><h1 style=\"margin:0 0 12px;font-size:22px;font-weight:800;color:#18181b;\">" + escapeHtml(title) + "</h1>" + body +
    "<p style=\"margin-top:24px;font-size:13px;color:#71717a;\">— L'équipe de l'Église Chay</p></div>" +
    "<div style=\"padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:11px;color:#a1a1aa;text-align:center;\">" +
    "<a href=\"" + APP_URL + "/settings\" style=\"color:#71717a;text-decoration:underline;\">Gérer mes préférences de notifications / Se désabonner</a></div>" +
    "</div></body></html>";
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messageId = body.message_id;
    if (!messageId) {
      return Response.json({ error: 'message_id required' }, { status: 400 });
    }

    const message = await base44.asServiceRole.entities.Message
      .get(messageId).catch(() => null);
    if (!message) {
      return Response.json({ error: 'message not found' }, { status: 404 });
    }

    const senderId = message.sender_id;
    const participants = Array.isArray(message.participant_ids)
      ? message.participant_ids : [];
    const targets = participants.filter((id) => id && id !== senderId);
    if (targets.length === 0) return Response.json({ sent: 0 });

    const notifIds = targets.map((uid) => "message_" + message.id + "_" + uid);
    const existing = await base44.asServiceRole.entities.UserNotification
      .filter({ notification_id: { $in: notifIds } }).catch(() => []);
    const done = new Set(
      (Array.isArray(existing) ? existing : []).map((n) => n.notification_id)
    );
    const pending = targets.filter(
      (uid) => !done.has("message_" + message.id + "_" + uid)
    );
    if (pending.length === 0) {
      return Response.json({ sent: 0, skipped: 'already_notified' });
    }

    const senderName = message.sender_name || "Quelqu'un";
    const isImageOnly = !message.text && !!message.image_url;
    const preview = isImageOnly ? "📷 Photo" : (message.text ? String(message.text).slice(0, 60) : "");
    const title = isImageOnly
      ? "Vous avez reçu une photo"
      : senderName + " vous a envoyé un message";
    const notifBody = isImageOnly
      ? senderName + " vous a envoyé une photo"
      : (message.text ? String(message.text).slice(0, 100) : "");

    let notifCreated = 0, emailsSent = 0, emailsSkipped = 0, pushSent = 0, openSkipped = 0;

    for (const uid of pending) {
      const recipient = await base44.asServiceRole.entities.User
        .get(uid).catch(() => null);
      const inAppOn = !recipient || recipient.in_app_messages !== false;
      const emailOn = !recipient || recipient.email_messages !== false;

      const profRows = await base44.asServiceRole.entities.MemberProfile
        .filter({ created_by_id: uid }, "-created_date", 1).catch(() => []);
      const prof = (Array.isArray(profRows) ? profRows : [])[0];
      const lastSeen = prof && prof.last_seen_at ? new Date(prof.last_seen_at).getTime() : 0;
      const isOnline = !!lastSeen && (Date.now() - lastSeen < ONLINE_WINDOW_MS);
      const conversationOpen = !!prof
        && prof.active_conversation_id === message.conversation_id
        && isOnline;

      if (conversationOpen) { openSkipped += 1; continue; }

      let createdNotifId = null;
      if (inAppOn) {
        try {
          const n = await base44.asServiceRole.entities.UserNotification.create({
            user_id: uid,
            notification_id: "message_" + message.id + "_" + uid,
            type: "message",
            content_id: message.conversation_id,
            content_type: "message",
            post_id: null,
            actor_id: senderId,
            actor_name: senderName,
            count: 1,
            title,
            message: notifBody,
            is_read: false,
          });
          createdNotifId = (n && n.id) || null;
          notifCreated += 1;
        } catch (e) {}
      }

      if (emailOn && recipient && recipient.email) {
        const recent = await base44.asServiceRole.entities.UserNotification
          .filter({ user_id: uid, content_id: message.conversation_id, type: "message" }, "-created_date", 10)
          .catch(() => []);
        const recentlyEmailed = (Array.isArray(recent) ? recent : []).some((n) => {
          if (!n.email_sent_at) return false;
          return Date.now() - new Date(n.email_sent_at).getTime() < EMAIL_DEDUP_MS;
        });
        const fresh = await base44.asServiceRole.entities.Message
          .get(message.id).catch(() => message);
        const alreadyRead = Array.isArray(fresh && fresh.read_by) && fresh.read_by.includes(uid);

        if (recentlyEmailed || alreadyRead) {
          emailsSkipped += 1;
        } else {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: recipient.email,
              subject: senderName + " vous a envoyé un message",
              html: messageEmailHtml(senderName, preview || notifBody, message.conversation_id),
            });
            emailsSent += 1;
            const stampId = createdNotifId || (Array.isArray(recent) && recent[0] && recent[0].id);
            if (stampId) {
              await base44.asServiceRole.entities.UserNotification
                .update(stampId, { email_sent_at: new Date().toISOString() }).catch(() => {});
            }
          } catch (e) {
            emailsSkipped += 1;
          }
        }
      }

      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: uid, title, content: notifBody, action_label: "Ouvrir",
          action_url: "/messages?c=" + message.conversation_id,
        });
        pushSent += 1;
      } catch (e) {}
    }

    return Response.json({
      notifCreated, emailsSent, emailsSkipped, pushSent, openSkipped, total: pending.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}