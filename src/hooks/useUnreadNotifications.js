import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Compte les notifications non lues du user connecté (tous types confondus).
 * Se met à jour en temps réel via l'abonnement à UserNotification.
 */
export function useUnreadNotifications(user) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;

    const load = async () => {
      try {
        const rows = await base44.entities.UserNotification.filter({
          user_id: user.id,
          is_read: false,
        });
        if (alive) setCount(Array.isArray(rows) ? rows.length : 0);
      } catch {
        if (alive) setCount(0);
      }
    };

    load();
    const unsub = base44.entities.UserNotification.subscribe(load);

    return () => {
      alive = false;
      if (typeof unsub === "function") unsub();
    };
  }, [user?.id]);

  return count;
}