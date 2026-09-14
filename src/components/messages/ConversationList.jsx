import React from "react";
import { MessageCircle, PenSquare, Loader2 } from "lucide-react";
import Avatar from "@/components/messages/Avatar";
import { isOnline, relTime } from "@/hooks/usePresence";
import PullToRefresh from "@/components/PullToRefresh";

export default function ConversationList({
  user,
  conversations,
  messagesByConv,
  profiles,
  loading,
  onOpen,
  onNew,
  onRefresh,
}) {
  const profileOf = (uid) => profiles.find((p) => p.created_by_id === uid);

  const items = conversations.map((c) => {
    const isGroup = c.type === "group";
    const msgs = messagesByConv[c.id] || [];
    const last = msgs[msgs.length - 1];
    const otherId = !isGroup ? c.participant_ids?.find((id) => id !== user?.id) : null;
    const otherProfile = profileOf(otherId);
    const title = isGroup ? c.name || "Groupe" : otherProfile?.display_name || "Membre";
    const avatar = isGroup ? c.photo_url : otherProfile?.avatar_url;
    const online = !isGroup && isOnline(otherProfile?.last_seen_at);
    const unread = msgs.filter(
      (m) => m.sender_id !== user?.id && !(m.read_by || []).includes(user?.id)
    ).length;
    const preview =
      (last ? (last.sender_id === user?.id ? "Vous : " : isGroup ? `${last.sender_name || ""} : ` : "") + (last.text || "") : "") ||
      c.last_message_text ||
      "Démarrez la conversation";
    const time = last?.created_date || c.last_message_at || c.updated_date;
    return { c, title, avatar, online, unread, preview, time };
  });

  return (
    <PullToRefresh mode="window" onRefresh={onRefresh}>
    <div>
      <header className="flex items-center justify-between mb-5">
        <h1 className="font-display font-extrabold text-3xl">
          <span className="brand-gradient-text">Messages</span>
        </h1>
        <button
          onClick={onNew}
          className="h-11 w-11 rounded-full brand-gradient text-white grid place-items-center shadow-sm hover:scale-105 transition"
          aria-label="Nouvelle conversation"
        >
          <PenSquare className="h-5 w-5" />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-10 w-10 mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50">
            Aucune conversation. Touchez ✏️ pour démarrer un échange.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((it) => (
            <button
              key={it.c.id}
              onClick={() => onOpen(it.c.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted transition text-left"
            >
              <Avatar name={it.title} src={it.avatar} size={48} online={it.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold truncate">{it.title}</span>
                  <span className="text-xs text-foreground/40 shrink-0">
                    {relTime(it.time)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-sm text-foreground/55 truncate">{it.preview}</span>
                  {it.unread > 0 && (
                    <span className="shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold h-5 min-w-[1.25rem] px-1 grid place-items-center">
                      {it.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}