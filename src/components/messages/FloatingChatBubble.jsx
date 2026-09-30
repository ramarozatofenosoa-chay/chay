import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePreferences } from "@/lib/PreferencesContext";
import { clearActiveChat, getActiveChat, setActiveChat } from "@/lib/activeChat";
import {
  canShowMessageNotification,
  countUnreadMessages,
  isRenderableMessage,
  isUnreadIncomingMessage,
} from "@/lib/messageNotifications";
import { Image } from "@/components/ui/image";
import { X } from "lucide-react";

export default function FloatingChatBubble() {
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chat, setChat] = useState(getActiveChat);
  const [unread, setUnread] = useState(0);
  const [last, setLast] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const chatRef = useRef(chat);
  const incomingRef = useRef(incoming);
  chatRef.current = chat;
  incomingRef.current = incoming;
  const canNotify = canShowMessageNotification(user, prefs);
  const openConversationId =
    location.pathname === "/messages" ? searchParams.get("c") : null;

  useEffect(() => {
    if (!canNotify) setIncoming(null);
  }, [canNotify]);

  useEffect(() => {
    const handler = () => setChat(getActiveChat());
    window.addEventListener("chay-active-chat-change", handler);
    return () => window.removeEventListener("chay-active-chat-change", handler);
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;

    const showIncoming = (message) => {
      const meta = {
        id: message.conversation_id,
        title: message.sender_name || "Nouveau message",
        avatar: null,
        isGroup: false,
      };
      setChat(meta);
      setActiveChat(meta);
      setIncoming({
        id: message.id,
        conversationId: message.conversation_id,
        senderName: message.sender_name || "Nouveau message",
        preview: message.text || (message.image_url ? "📷 Photo" : ""),
      });
    };

    const load = async () => {
      try {
        const messages = await base44.entities.Message.list("-created_date", 50);
        const rows = Array.isArray(messages) ? messages : [];
        if (cancelled) return;
        setUnread(countUnreadMessages(rows, user.id));
        const newestUnread = rows.find(
          (message) =>
            isUnreadIncomingMessage(message, user.id) &&
            message.conversation_id !== openConversationId
        );
        if (canNotify && newestUnread) showIncoming(newestUnread);
      } catch (error) {
        console.error("[Messages] Impossible de charger le dernier message reçu.", error);
      }
    };
    load();

    const unsub = base44.entities.Message.subscribe((event) => {
      const message = event?.data;
      if (!message) return;

      if (event.type === "create") {
        if (message.sender_id === user.id) return;
        const unreadMessage = isUnreadIncomingMessage(message, user.id);
        if (unreadMessage) setUnread((count) => count + 1);
        if (
          unreadMessage &&
          canNotify &&
          message.conversation_id !== openConversationId
        ) {
          showIncoming(message);
        }
        if (
          isRenderableMessage(message) &&
          message.conversation_id === chatRef.current?.id
        ) setLast(message);
        return;
      }

      if (
        event.type === "update" &&
        incomingRef.current?.id === message.id &&
        (!isRenderableMessage(message) ||
          (message.read_by || []).includes(user.id))
      ) {
        setIncoming(null);
      }
      if (!isRenderableMessage(message)) {
        if (message.conversation_id === chatRef.current?.id) {
          setLast((previous) => previous?.id === message.id ? null : previous);
        }
        return;
      }
      if (
        message.conversation_id === chatRef.current?.id
      ) {
        setLast((previous) =>
          new Date(message.created_date || 0) >
          new Date(previous?.created_date || 0)
            ? message
            : previous
        );
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [
    canNotify,
    openConversationId,
    user?.id,
  ]);

  useEffect(() => {
    if (!chat?.id || !user?.id) return undefined;
    let cancelled = false;
    base44.entities.Message
      .filter({ conversation_id: chat.id }, "-created_date", 50)
      .then((rows) => {
        if (cancelled) return;
        const messages = Array.isArray(rows) ? rows : [];
        setLast(messages.find(isRenderableMessage) || null);
        setUnread(countUnreadMessages(messages, user.id));
      })
      .catch((error) => {
        console.error("[Messages] Impossible de charger l'aperçu de conversation.", error);
      });
    return () => {
      cancelled = true;
    };
  }, [chat?.id, user?.id]);

  if (!chat || !user || location.pathname === "/messages" && !incoming) return null;
  if (incoming && incoming.conversationId === openConversationId) return null;

  const preview =
    incoming?.preview ||
    (last
      ? (last.sender_id === user.id ? "Vous : " : "") +
        (last.text || (last.image_url ? "📷 Photo" : ""))
      : "") ||
    "Reprendre la conversation";
  const title = incoming?.senderName || chat.title;

  return (
    <div className="fixed z-40 right-4 bottom-24 md:bottom-8 md:right-6 flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-xl shadow-xl pl-2 pr-2 py-2 max-w-[19rem] animate-float-in">
      <button
        type="button"
        onClick={() => {
          setIncoming(null);
          navigate(`/messages?c=${chat.id}`);
        }}
        className="flex min-w-0 items-center gap-3 text-left"
        aria-label={`Ouvrir la conversation : ${title}`}
      >
        <span className="relative shrink-0">
          {chat.avatar ? (
            <Image src={chat.avatar} alt="" fittingType="fill" className="h-10 w-10 rounded-full" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full brand-gradient font-bold text-white">
              {(title || "M")[0]?.toUpperCase()}
            </span>
          )}
          {(incoming || unread > 0) && (
            <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? "99+" : Math.max(1, unread)}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold leading-tight">{title}</span>
          <span className="block truncate text-xs leading-tight text-foreground/60">{preview}</span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Fermer la bulle de conversation"
        onClick={() => {
          setIncoming(null);
          clearActiveChat();
        }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted"
      >
        <X className="h-4 w-4 text-foreground/60" />
      </button>
    </div>
  );
}
