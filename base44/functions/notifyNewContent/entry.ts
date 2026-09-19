import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Appelée par l'admin lors de la publication d'un contenu (publishContentWithNotification).
// - Idempotent : une seule fois par contenu (notification_id "content_<id>").
// - Crée une UserNotification (type new_content) pour tous les utilisateurs
//   ayant in_app_nouveautes activé (par lots de 500, pagination des users).
// - Envoie un e-mail à tous les utilisateurs ayant email_nouveautes activé,
//   uniquement si send_email est vrai (réglage admin), par lots de 25.
// - Envoie un push natif FCM aux utilisateurs ayant in_app_nouveautes activé
//   (via sendFcmPush, par lots interne), titre = "Nouveau : " + titre du contenu.
// Admin uniquement.
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

function contentEmailHtml(title, description) {
  const cta = APP_URL + "/media";
  const body =
    "<p style=\"margin:0 0 8px;font-size:15px;color:#3f3f46;\">Un nouveau contenu vient d'être publié dans l'application Chay.</p>" +
    "<p style=\"margin:0 0 4px;font-size:17px;font-weight:700;color:#18181b;\">" + escapeHtml(title) + "</p>" +
    (description ? "<p style=\"margin:0 0 8px;font-size:14px;color:#52525b;\">" + escapeHtml(description) + "</p>" : "") +
    "<a href=\"" + cta + "\" style=\"display:inline-block;margin-top:18px;background:linear-gradient(100deg,#4A6CFE 0%,#8A56E2 50%,#FF57B2 100%);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px;\">Découvrir maintenant</a>";
  return shellHtml("Nouveau contenu", body);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const contentId = body.content_id;
    const sendEmail = body.send_email !== false;
    if (!contentId) return Response.json({ error: 'content_id required' }, { status: 400 });

    const content = await base44.asServiceRole.entities.Content
      .get(contentId).catch(() => null);
    if (!content) return Response.json({ error: 'content not found' }, { status: 404 });

    const notifId = "content_" + content.id;
    const already = await base44.asServiceRole.entities.UserNotification
      .filter({ notification_id: notifId }, null, 1).catch(() => []);
    if (Array.isArray(already) && already.length > 0) {
      return Response.json({ skipped: 'already_notified' });
    }

    const title = "Nouveau : " + (content.title || "Contenu");
    const messageText = (content.description || "").slice(0, 160);

    const rows = [];
    let skip = 0;
    while (skip < 5000) {
      const batch = await base44.asServiceRole.entities.User
        .list('-created_date', 500, skip).catch(() => []);
      const arr = Array.isArray(batch) ? batch : [];
      for (const u of arr) {
        if (u.in_app_nouveautes === false) continue;
        rows.push({
          user_id: u.id,
          notification_id: notifId,
          type: 'new_content',
          content_id: content.id,
          content_type: content.type,
          title,
          message: messageText,
          thumbnail_url: content.thumbnail_url || '',
          is_read: false,
        });
      }
      if (arr.length < 500) break;
      skip += 500;
    }

    let created = 0;
    for (let i = 0; i < rows.length; i += 500) {
      try {
        const res = await base44.asServiceRole.entities.UserNotification
          .bulkCreate(rows.slice(i, i + 500));
        created += Array.isArray(res) ? res.length : 0;
      } catch (e) {}
    }

    let emailsSent = 0, emailsSkipped = 0;
    if (sendEmail) {
      const emailUsers = [];
      skip = 0;
      while (skip < 5000) {
        const batch = await base44.asServiceRole.entities.User
          .list('-created_date', 500, skip).catch(() => []);
        const arr = Array.isArray(batch) ? batch : [];
        for (const u of arr) {
          if (u.email_nouveautes === false) continue;
          if (!u.email) continue;
          emailUsers.push(u);
        }
        if (arr.length < 500) break;
        skip += 500;
      }
      for (let i = 0; i < emailUsers.length; i += 25) {
        const chunk = emailUsers.slice(i, i + 25);
        await Promise.all(chunk.map(async (u) => {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: u.email,
              subject: title,
              html: contentEmailHtml(content.title, content.description),
            });
            emailsSent += 1;
          } catch (e) { emailsSkipped += 1; }
        }));
      }
    }

    // Push natif FCM (par lots interne) aux utilisateurs ayant in_app_nouveautes activé.
    let pushSent = 0, pushFailed = 0;
    const pushUserIds = rows.map((r) => r.user_id);
    if (pushUserIds.length) {
      try {
        const res = await base44.asServiceRole.functions.invoke("sendFcmPush", {
          user_ids: pushUserIds,
          title,
          body: (content.description || content.title || "").slice(0, 60),
          target_type: "content",
          target_id: content.id,
          internal_secret: secrets.get("INTERNAL_INVOKE_SECRET"),
        });
        const r = (res && (res.data || res)) || {};
        pushSent = r.sent || 0;
        pushFailed = r.failed || 0;
      } catch (e) {
        pushFailed = pushUserIds.length;
      }
    }

    return Response.json({
      recipients: rows.length, created, emailsSent, emailsSkipped, pushSent, pushFailed, sendEmail,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}