import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Envoi de notifications push natives via Firebase Cloud Messaging (API HTTP v1).
// - Compte de service stocké dans le secret FIREBASE_SERVICE_ACCOUNT (jamais côté frontend).
// - Auth : accepte (a) un appel direct admin (base44.auth.me() admin, bouton de test),
//   ou (b) un appel interne d'une autre fonction prouvé par caller_email == client_email
//   du compte de service (seul le backend connaît cette valeur).
// - Récupère les tokens actifs des destinataires, envoie, et désactive les tokens
//   invalides (UNREGISTERED / INVALID_ARGUMENT). Envoi par lots (concurrence 20).
const CHANNEL_ID = "chay-default";

function b64urlBytes(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function jsonB64(obj) {
  return b64urlBytes(new TextEncoder().encode(JSON.stringify(obj)));
}
function pemToDer(pem) {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: sa.private_key_id };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput = jsonB64(header) + "." + jsonB64(payload);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = signingInput + "." + b64urlBytes(new Uint8Array(sig));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt,
  });
  const json = await res.json();
  if (!json.access_token) {
    throw new Error("Token FCM non obtenu : " + (json.error_description || JSON.stringify(json)));
  }
  return json.access_token;
}

async function sendOne(projectId, accessToken, token, title, body, targetType, targetId) {
  const url = "https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send";
  const message = {
    token,
    notification: { title, body },
    android: {
      notification: {
        channel_id: CHANNEL_ID,
        default_vibrate_timings: true,
        notification_count: 1,
      },
    },
    data: {
      target_type: String(targetType || ""),
      target_id: String(targetId || ""),
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  let raw = null;
  try { raw = await res.json(); } catch { raw = { status: res.status }; }
  if (res.ok) return { ok: true, raw };
  const errName =
    (raw && raw.error && raw.error.details && raw.error.details[0] && raw.error.details[0].errorCode) ||
    (raw && raw.error && raw.error.status) ||
    "";
  const invalid = /UNREGISTERED|INVALID_ARGUMENT/.test(errName);
  return { ok: false, invalid, raw };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const saRaw = secrets.get("FIREBASE_SERVICE_ACCOUNT");
    if (!saRaw) {
      return Response.json({ error: "FIREBASE_SERVICE_ACCOUNT manquant" }, { status: 500 });
    }
    const sa = JSON.parse(saRaw);

    // Authentification : admin direct (test) OU appel interne prouvé.
    let user = null;
    try { user = await base44.auth.me(); } catch { /* appel interne */ }
    const internalProof = body.caller_email && body.caller_email === sa.client_email;
    if (!(user && user.role === "admin") && !internalProof) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Destinataires.
    let userIds = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean) : [];
    if (user && user.role === "admin" && body.test) userIds = [user.id];
    if (userIds.length === 0) {
      return Response.json({ sent: 0, tokensFound: 0, failed: 0, firebaseResponses: [] });
    }

    const title = String(body.title || "Chay").slice(0, 100);
    const msgBody = String(body.body || "").slice(0, 100);
    const targetType = body.target_type || "";
    const targetId = body.target_id || "";

    // Récupération des tokens actifs.
    const tokenRecords = [];
    for (const uid of userIds) {
      const rows = await base44.asServiceRole.entities.DeviceToken
        .filter({ user_id: uid, is_active: true }, null, 50)
        .catch(() => []);
      for (const r of (Array.isArray(rows) ? rows : [])) tokenRecords.push(r);
    }

    if (tokenRecords.length === 0) {
      return Response.json({ sent: 0, tokensFound: 0, failed: 0, firebaseResponses: [] });
    }

    const accessToken = await getAccessToken(sa);
    const projectId = sa.project_id;

    let sent = 0, failed = 0;
    const invalidIds = [];
    const firebaseResponses = [];

    // Envoi par lots (concurrence 20).
    const CHUNK = 20;
    for (let i = 0; i < tokenRecords.length; i += CHUNK) {
      const chunk = tokenRecords.slice(i, i + CHUNK);
      await Promise.all(chunk.map(async (rec) => {
        const r = await sendOne(projectId, accessToken, rec.token, title, msgBody, targetType, targetId);
        firebaseResponses.push(r.raw);
        if (r.ok) sent += 1;
        else {
          failed += 1;
          if (r.invalid) invalidIds.push(rec.id);
        }
      }));
    }

    // Désactivation des tokens invalides.
    for (const id of invalidIds) {
      await base44.asServiceRole.entities.DeviceToken
        .update(id, { is_active: false }).catch(() => {});
    }

    return Response.json({
      sent,
      failed,
      tokensFound: tokenRecords.length,
      invalidDeactivated: invalidIds.length,
      firebaseResponses,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}