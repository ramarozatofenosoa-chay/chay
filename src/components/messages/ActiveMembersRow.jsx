import React from "react";
import Avatar from "@/components/messages/Avatar";
import { isOnline } from "@/hooks/usePresence";
import { findOrCreateDirect } from "@/lib/conversations";

export default function ActiveMembersRow({ user, profiles, onOpen }) {
  const online = profiles.filter(
    (p) => p.created_by_id !== user?.id && isOnline(p.last_seen_at)
  );
  if (!online.length) return null;

  const first = (p) => (p.display_name || "Membre").split(" ")[0];

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-2">
      {online.map((p) => (
        <button
          key={p.id}
          onClick={async () => {
            const id = await findOrCreateDirect(user, p.created_by_id);
            onOpen(id);
          }}
          className="flex flex-col items-center gap-1 shrink-0 w-16 text-center"
          aria-label={`Ouvrir la conversation avec ${p.display_name || "Membre"}`}
        >
          <Avatar name={p.display_name} src={p.avatar_url} size={48} online />
          <span className="text-xs text-foreground/60 truncate w-full">
            {first(p)}
          </span>
        </button>
      ))}
    </div>
  );
}