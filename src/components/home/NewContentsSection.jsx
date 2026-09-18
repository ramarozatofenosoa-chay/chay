import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { NEW_CONTENTS_LIMIT } from "@/lib/contentNotifications";
import NewContentCard from "./NewContentCard";
import ContentDetailDialog from "./ContentDetailDialog";
import { Sparkles, History } from "lucide-react";

export default function NewContentsSection() {
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [unreadIds, setUnreadIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([
        base44.entities.Content.filter({ status: "published" }, "-published_at", 200),
        user?.id
          ? base44.entities.UserNotification.filter({
              user_id: user.id,
              is_read: false,
            })
          : Promise.resolve([]),
      ]);
      const list = (Array.isArray(all) ? all : []).filter((c) => c.published_at);
      setContents(list);
      const unread = new Set();
      (Array.isArray(mine) ? mine : []).forEach((n) => {
        if (n.content_id) unread.add(n.content_id);
      });
      setUnreadIds(unread);
    } catch {
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (item) => {
    if (unreadIds.has(item.id) && user?.id) {
      try {
        const mine = await base44.entities.UserNotification.filter({
          user_id: user.id,
          content_id: item.id,
          is_read: false,
        });
        const rows = Array.isArray(mine) ? mine : [];
        if (rows.length) {
          await base44.entities.UserNotification.bulkUpdate(
            rows.map((r) => ({
              id: r.id,
              is_read: true,
              read_at: new Date().toISOString(),
            }))
          );
        }
        setUnreadIds((prev) => {
          const n = new Set(prev);
          n.delete(item.id);
          return n;
        });
      } catch {
        /* ignore */
      }
    }
    setActive(item);
  };

  if (loading || !contents.length) return null;

  const nouveautes = contents.slice(0, NEW_CONTENTS_LIMIT);
  const historiques = contents.slice(NEW_CONTENTS_LIMIT);

  return (
    <>
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display font-extrabold text-2xl">Nouveautés</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nouveautes.map((c) => (
            <NewContentCard
              key={c.id}
              item={c}
              unread={unreadIds.has(c.id)}
              onOpen={() => open(c)}
            />
          ))}
        </div>
      </section>

      {historiques.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-display font-extrabold text-2xl">Historiques</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {historiques.map((c) => (
              <NewContentCard
                key={c.id}
                item={c}
                unread={unreadIds.has(c.id)}
                onOpen={() => open(c)}
              />
            ))}
          </div>
        </section>
      )}

      <ContentDetailDialog
        item={active}
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
      />
    </>
  );
}