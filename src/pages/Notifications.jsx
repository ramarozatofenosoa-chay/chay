import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import {
  Bell,
  CheckCheck,
  Loader2,
  Music,
  Film,
  BookOpen,
  GraduationCap,
  Megaphone,
  CalendarDays,
  Newspaper,
  FileText,
  Heart,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const ICONS = {
  audio: Music,
  video: Film,
  predication: BookOpen,
  enseignement: GraduationCap,
  annonce: Megaphone,
  evenement: CalendarDays,
  actualite: Newspaper,
  autre: FileText,
  like: Heart,
  comment: MessageCircle,
};

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const unread = useUnreadNotifications(user);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await base44.entities.UserNotification.filter(
        { user_id: user.id },
        "-created_date",
        100
      );
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
    const unsub = base44.entities.UserNotification.subscribe(load);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [load]);

  const openOne = async (n) => {
    if (!n.is_read) {
      try {
        await base44.entities.UserNotification.update(n.id, {
          is_read: true,
          read_at: new Date().toISOString(),
        });
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      } catch {
        /* ignore */
      }
    }
    if (n.type === "new_content") {
      if (n.content_id) {
        const c = await base44.entities.Content.get(n.content_id).catch(() => null);
        if (c?.media_url) {
          window.open(c.media_url, "_blank");
          return;
        }
      }
      navigate("/media");
    }
  };

  const markAll = async () => {
    const unreadRows = items.filter((i) => !i.is_read);
    if (!unreadRows.length) return;
    try {
      await base44.entities.UserNotification.bulkUpdate(
        unreadRows.map((i) => ({
          id: i.id,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
      toast({ title: "Tout marqué comme lu" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-6 md:py-10">
      <header className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display font-extrabold text-3xl">
          <span className="brand-gradient-text">Notifications</span>
        </h1>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="h-4 w-4 mr-2" /> Tout marquer comme lu
          </Button>
        )}
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <Bell className="h-10 w-10 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50">Aucune notification.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.content_type] || Sparkles;
            return (
              <button
                key={n.id}
                onClick={() => openOne(n)}
                className={`w-full text-left rounded-2xl border p-3 flex items-start gap-3 transition min-h-[64px] ${
                  n.is_read
                    ? "border-border bg-card"
                    : "border-primary/30 bg-primary/5"
                }`}
                aria-label={`${n.title}${n.is_read ? "" : ", non lu"}`}
              >
                <span
                  className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${
                    n.is_read
                      ? "bg-foreground/10 text-foreground"
                      : "brand-gradient text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-sm">{n.title}</span>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </span>
                  {n.message && (
                    <span className="block text-xs text-foreground/60 mt-0.5 line-clamp-2">
                      {n.message}
                    </span>
                  )}
                  <span className="block text-xs text-foreground/40 mt-1">
                    {new Date(n.created_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}