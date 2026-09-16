import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getActiveChat, clearActiveChat } from "@/lib/activeChat";
import { Image } from "@/components/ui/image";
import { X } from "lucide-react";

export default function FloatingChatBubble() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [chat, setChat] = useState(getActiveChat);
  const [unread, setUnread] = useState(0);
  const [last, setLast] = useState(null);

  useEffect(() => {
    const handler = () => setChat(getActiveChat());
    window.addEventListener("chay-active-chat-change", handler);
    return () => window.removeEventListener("chay-active-chat-change", handler);
  }, []);

  useEffect(() => {
    if (!chat?.id || !user?.id) return;
    let cancelled = false;

    const load = async () => {
      const msgs = await base44.entities.Message
        .filter({ conversation_id: chat.id }, "-created_date", 50)
        .catch(() => []);
      const arr = Array.isArray(msgs) ? msgs : [];
      if (cancelled) return;
      setLast(arr[0] || null);
      setUnread(
        arr.filter(
          (m) => m.sender_id !== user.id && !(m.read_by || []).includes(user.id)
        ).length
      );
    };
    load();

    const unsub = base44.entities.Message.subscribe((event) => {
      const m = event.data;
      if (!m || m.conversation_id !== chat.id) return;
      setLast((prev) =>
        new Date(m.created_date) > new Date(prev?.created_date || 0) ? m : prev
      );
      setUnread((prev) => {
        if (m.sender_id === user.id) return prev;
        if (event.type === "create" && !(m.read_by || []).includes(user.id))
          return prev + 1;
        if (event.type === "update" && (m.read_by || []).includes(user.id))
          return Math.max(0, prev - 1);
        return prev;
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [chat?.id, user?.id]);

  if (!chat || !user || location.pathname === "/messages") return null;

  const preview = last
    ? (last.sender_id === user.id ? "Vous : " : "") +
      (last.text || (last.image_url ? "📷 Photo" : ""))
    : "Reprendre la conversation";

  return (
    <button
      onClick={() => navigate(`/messages?c=${chat.id}`)}
      className="fixed z-40 right-4 bottom-24 md:bottom-8 md:right-6 flex items-center gap-3 rounded-full border border-border bg-card/95 backdrop-blur-xl shadow-xl pl-2 pr-3 py-2 max-w-[18rem] hover:scale-[1.02] transition text-left animate-float-in"
      aria-label={`Reprendre la conversation : ${chat.title}`}
    >
      <div className="relative shrink-0">
        {chat.avatar ? (
          <Image
            src={chat.avatar}
            alt=""
            fittingType="fill"
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full brand-gradient grid place-items-center text-white font-bold">
            {(chat.title || "M")[0]?.toUpperCase()}
          </div>
        )}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-2 border-card">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate leading-tight">
          {chat.title}
        </div>
        <div className="text-xs text-foreground/60 truncate leading-tight">
          {preview}
        </div>
      </div>
      <span
        role="button"
        aria-label="Fermer"
        onClick={(e) => {
          e.stopPropagation();
          clearActiveChat();
        }}
        className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted shrink-0"
      >
        <X className="h-4 w-4 text-foreground/60" />
      </span>
    </button>
  );
}