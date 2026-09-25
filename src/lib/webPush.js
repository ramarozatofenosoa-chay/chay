import { base44 } from "@/api/base44Client";

// Push navigateur (Web Push / VAPID).
// - La clé publique est codée en dur (elle est publique par conception) ;
//   la clé privée vit dans le secret Base44 VAPID_PRIVATE_KEY, jamais ici.
// - Les abonnements sont persistés dans l'entité WebPushSubscription,
//   un row par appareil (endpoint unique).
// - public/sw.js affiche la notification système et renvoie le clic ici.
export const VAPID_PUBLIC_KEY =
  "BCWq_4_Qu_DqSH3SR-s0xyCt8gE29xZ4LilwMf3Hp5DyekihEmRVGkt7fwsCoago_sXoD23roB20zW5sZNnC_LE";

const SW_URL = "/sw.js";

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function saveSubscription(userId, subscription) {
  const keys = (subscription.toJSON() || {}).keys || {};
  const payload = {
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh || "",
    auth: keys.auth || "",
    user_agent: navigator.userAgent.slice(0, 300),
    is_active: true,
    last_seen: new Date().toISOString(),
  };
  const rows = await base44.entities.WebPushSubscription
    .filter({ endpoint: payload.endpoint }, null, 1)
    .catch(() => []);
  const existing = Array.isArray(rows) && rows[0];
  if (existing) {
    await base44.entities.WebPushSubscription.update(existing.id, payload);
  } else {
    await base44.entities.WebPushSubscription.create(payload);
  }
}

// Demande la permission puis (ré)abonne cet appareil. À appeler depuis un
// clic utilisateur : la permission navigateur exige une gestuelle (Safari).
export async function enableWebPush(userId) {
  if (!isWebPushSupported()) {
    throw new Error("Ce navigateur ne prend pas en charge les notifications.");
  }
  if (!userId) throw new Error("Connectez-vous pour activer les notifications.");
  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error("Permission de notifications refusée dans le navigateur.");
  }
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await saveSubscription(userId, subscription);
}

// Désabonne cet appareil (le row est marqué inactif, jamais supprimé —
// on garde la trace pour le diagnostic).
export async function disableWebPush() {
  if (!isWebPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = registration
      ? await registration.pushManager.getSubscription()
      : null;
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => {});
    const rows = await base44.entities.WebPushSubscription
      .filter({ endpoint }, null, 1)
      .catch(() => []);
    if (Array.isArray(rows) && rows[0]) {
      await base44.entities.WebPushSubscription
        .update(rows[0].id, { is_active: false, last_seen: new Date().toISOString() })
        .catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

// À l'ouverture de l'app : si la permission est déjà accordée, (ré)abonne
// cet appareil silencieusement (aucune demande intrusive). Un abonnement
// révoqué (logout, nettoyage navigateur) est ainsi recréé automatiquement.
export async function syncWebPush(userId) {
  if (!userId || !isWebPushSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    const subscription =
      (await registration.pushManager.getSubscription()) ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));
    await saveSubscription(userId, subscription);
  } catch {
    /* ignore */
  }
}

export async function webPushState() {
  const supported = isWebPushSupported();
  const permission = typeof Notification !== "undefined" ? Notification.permission : "denied";
  let subscribed = false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    subscribed = !!(registration && (await registration.pushManager.getSubscription()));
  } catch {
    /* ignore */
  }
  return { supported, permission, subscribed };
}

// Clic sur une notification push : le service worker renvoie l'URL cible.
export function onWebPushNotificationClick(handler) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }
  const listener = (event) => {
    const data = event.data;
    if (data && data.type === "chay-notification-click") handler(data);
  };
  navigator.serviceWorker.addEventListener("message", listener);
  return () => navigator.serviceWorker.removeEventListener("message", listener);
}
