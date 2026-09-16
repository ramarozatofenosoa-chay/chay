import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Counts unread messages across all of the user's conversations.
// RLS scopes Message.list() to conversations the user participates in.
export function useUnreadMessages(user) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let stopped = false;

    const load = async () => {
      const msgs = await base44.entities.Message.list("-created_date", 500).catch(
        () => []
      );
      if (stopped) return;
      const arr = Array.isArray(msgs) ? msgs : [];
      const count = arr.filter(
        (m) => m.sender_id !== user.id && !(m.read_by || []).includes(user.id)
      ).length;
      setUnread(count);
    };

    load();
    const unsubM = base44.entities.Message.subscribe(() => load());
    const unsubC = base44.entities.Conversation.subscribe(() => load());
    return () => {
      stopped = true;
      unsubM();
      unsubC();
    };
  }, [user?.id]);

  return unread;
}