import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { X } from "lucide-react";

// Bandeau discret en haut de l'écran quand une notification arrive pendant que
// l'app est ouverte. S'abonne à UserNotification (temps réel). Clic = ouvrir la
// cible + marquer comme lu.
export default function NotificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const lastDateRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    const init = async () => {
      const rows = await base44.entities.UserNotification
        .filter({ user_id: user.id }, "-created_date", 1)
        .catch(() => []);
      if (alive) {
        lastDateRef.current = (rows && rows[0] && rows[0].created_date) || new Date().toISOString();
      }
    };
    init();
    const unsub = base44.entities.UserNotification.subscribe((event) => {
      if (!event || event.type !== "create") return;
      const n = event.data;
      if (!n || n.user_id !== user.id || n.is_read) return;
      if (!lastDateRef.current) return;
      if (new Date(n.created_date) > new Date(lastDateRef.current)) {
        lastDateRef.current = n.created_date;
        setBanner(n);
      }
    });
    return () => {
      alive = false;
      if (typeof unsub === "function") unsub();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!banner) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBanner(null), 7000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [banner]);

  const open = async () => {
    const n = banner;
    if (!n) return;
    setBanner(null);
    try {
      await base44.entities.UserNotification.update(n.id, {
        is_read: true,
        read_at: new Date().toISOString(),
      });
    } catch {
      /* ignore */
    }
    if (n.type === "message" || n.content_type === "message") {
      navigate(n.content_id ? `/messages?c=${n.content_id}` : "/messages");
    } else if (n.type === "new_content") {
      navigate("/media");
    } else if (n.type === "like" || n.type === "comment") {
      navigate("/community");
    }
  };

  if (!banner) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md">
      <button
        onClick={open}
        className="w-full text-left rounded-2xl border border-border bg-card/95 backdrop-blur shadow-lg p-3 flex items-center gap-3 animate-float-in"
      >
        <span className="h-9 w-9 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
          <span className="h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold truncate">{banner.title}</span>
          {banner.message && (
            <span className="block text-xs text-foreground/60 truncate">{banner.message}</span>
          )}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); setBanner(null); }}
          className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted shrink-0"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}