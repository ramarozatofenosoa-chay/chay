import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_ID = "chay-default";
const CHANNEL_NAME = "Chay";

// Émet un évènement global lu par la carte de statut push (Réglages).
function emitStatus(detail) {
  try {
    window.dispatchEvent(new CustomEvent("chay-push-status", { detail }));
  } catch {
    /* ignore */
  }
}

function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function upsertToken(token, platform) {
  const rows = await base44.entities.DeviceToken.filter({ token }, null, 1).catch(() => []);
  const existing = Array.isArray(rows) && rows[0];
  const now = new Date().toISOString();
  if (existing) {
    await base44.entities.DeviceToken.update(existing.id, {
      is_active: true,
      last_seen: now,
      platform,
    });
  } else {
    await base44.entities.DeviceToken.create({
      token,
      platform,
      is_active: true,
      last_seen: now,
    });
  }
}

async function deactivateToken(token) {
  const rows = await base44.entities.DeviceToken.filter({ token }, null, 1).catch(() => []);
  const existing = Array.isArray(rows) && rows[0];
  if (existing) {
    await base44.entities.DeviceToken
      .update(existing.id, { is_active: false })
      .catch(() => {});
  }
}

// Enregistre le token FCM de l'appareil (uniquement sur build natif Android).
// Au premier lancement, affiche un court message FR puis demande l'autorisation.
export function usePushNotifications(navigate) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!isNative() || !isAuthenticated || !user?.id) return;
    let handles = [];
    let active = true;

    const start = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt") {
          toast({
            title: "Notifications activées",
            description:
              "Nous vous prévenons des nouveaux messages et nouveautés, même quand l'app est fermée.",
          });
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== "granted") {
          emitStatus({ error: "Permission de notifications refusée." });
          return;
        }

        try {
          await PushNotifications.createChannel({
            id: CHANNEL_ID,
            name: CHANNEL_NAME,
            description: "Messages et nouveautés",
            importance: 4, // Haute
            visibility: 1, // Public
            vibration: true,
          });
        } catch {
          /* iOS / web : pas de canal */
        }

        handles.push(
          await PushNotifications.addListener("registration", (ev) => {
            tokenRef.current = ev.value;
            upsertToken(ev.value, "android").catch((e) =>
              emitStatus({
                error: "Échec de l'enregistrement du token : " + (e?.message || e),
              })
            );
            emitStatus({ ok: true });
          })
        );
        handles.push(
          await PushNotifications.addListener("registrationError", (err) => {
            emitStatus({
              error: "Erreur d'enregistrement push : " + (err?.error || JSON.stringify(err)),
            });
          })
        );
        handles.push(
          await PushNotifications.addListener("pushNotificationReceived", () => {
            // App ouverte : Capacitor n'affiche pas de notification système en
            // foreground. Le bandeau in-app est déclenché par la UserNotification
            // créée côté backend (abonnement temps réel) — pas de doublon.
          })
        );
        handles.push(
          await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            const data = action?.notification?.data || {};
            const t = data.target_type;
            const id = data.target_id;
            if (t === "message" && id) navigate(`/messages?c=${id}`);
            else if (t === "content") navigate("/media");
            else if (t === "community") navigate("/community");
          })
        );

        await PushNotifications.register();
      } catch (e) {
        if (active) emitStatus({ error: e?.message || String(e) });
      }
    };
    start();

    return () => {
      active = false;
      handles.forEach((h) => h && typeof h.remove === "function" && h.remove());
      handles = [];
    };
  }, [isAuthenticated, user?.id]);

  // Déconnexion : désactiver le token de cet appareil.
  useEffect(() => {
    if (!isNative()) return;
    if (!isAuthenticated && tokenRef.current) {
      deactivateToken(tokenRef.current);
      tokenRef.current = null;
    }
  }, [isAuthenticated]);
}