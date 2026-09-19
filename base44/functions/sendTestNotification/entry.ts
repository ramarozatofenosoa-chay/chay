import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Admin uniquement : crée une notification de test pour l'admin connecté et
// envoie un e-mail de test. Renvoie le résultat détaillé (notification créée
// ou non, e-mail envoyé ou non, erreurs éventuelles).
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

function testEmailHtml(recipientName) {
  const body =
    "<p style=\"margin:0 0 8px;font-size:15px;color:#3f3f46;\">Bonjour " + escapeHtml(recipientName || "") + ",</p>" +
    "<p style=\"margin:0 0 8px;font-size:15px;color:#3f3f46;\">Ceci est un e-mail de test du système de notifications de l'Église Chay. Si vous le recevez, l'envoi d'e-mails fonctionne correctement.</p>" +
    "<a href=\"" + APP_URL + "\" style=\"display:inline-block;margin-top:18px;background:linear-gradient(100deg,#4A6CFE 0%,#8A56E2 50%,#FF57B2 100%);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px;\">Ouvrir l'application</a>";
  return shellHtml("Notification de test", body);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let notifCreated = false, notifId = null, notifError = null;
    try {
      const n = await base44.asServiceRole.entities.UserNotification.create({
        user_id: user.id,
        notification_id: "test_" + user.id + "_" + Date.now(),
        type: 'new_content',
        title: 'Notification de test',
        message: "Ceci est une notification de test envoyée par l'administrateur.",
        content_type: 'test',
        is_read: false,
      });
      notifCreated = true;
      notifId = (n && n.id) || null;
    } catch (e) { notifError = e.message; }

    let emailSent = false, emailError = null;
    if (user.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: 'Notification de test — Église Chay',
          html: testEmailHtml(user.full_name || user.first_name || ''),
        });
        emailSent = true;
      } catch (e) { emailError = e.message; }
    }

    return Response.json({
      notification: { created: notifCreated, id: notifId, error: notifError },
      email: { sent: emailSent, to: user.email || null, error: emailError },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}