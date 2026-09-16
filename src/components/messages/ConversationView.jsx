import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  Send,
  Loader2,
  Reply,
  Image as ImageIcon,
  X,
  Smile,
  Settings,
} from "lucide-react";
import Avatar from "@/components/messages/Avatar";
import { Image } from "@/components/ui/image";
import { isOnline, lastSeenLabel } from "@/hooks/usePresence";
import GroupSettingsSheet from "@/components/messages/GroupSettingsSheet";
import EmojiPicker from "@/components/messages/EmojiPicker";
import MessageActionMenu from "@/components/messages/MessageActionMenu";
import ReadReceipts from "@/components/messages/ReadReceipts";
import PhotoViewer from "@/components/messages/PhotoViewer";

function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationView({
  conversation,
  messages,
  user,
  profiles,
  onBack,
  onRefresh,
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [viewer, setViewer] = useState(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingSent = useRef(false);
  const pressTimer = useRef(null);
  const pressPoint = useRef({ x: 0, y: 0 });

  const isGroup = conversation?.type === "group";
  const otherId = !isGroup
    ? conversation?.participant_ids?.find((id) => id !== user?.id)
    : null;
  const otherProfile = profiles.find((p) => p.created_by_id === otherId);
  const title = isGroup
    ? conversation?.name || "Groupe"
    : otherProfile?.display_name || "Membre";
  const avatarUrl = isGroup ? conversation?.photo_url : otherProfile?.avatar_url;
  const online = !isGroup && isOnline(otherProfile?.last_seen_at);
  const statusText = isGroup
    ? `${conversation?.participant_ids?.length || 0} membres`
    : lastSeenLabel(otherProfile?.last_seen_at);

  const myName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "Membre";

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  // Mark incoming unread messages as read
  useEffect(() => {
    if (!conversation || !user) return;
    messages.forEach((m) => {
      if (m.sender_id === user.id) return;
      if ((m.read_by || []).includes(user.id)) return;
      base44.entities.Message
        .update(m.id, { read_by: [...(m.read_by || []), user.id] })
        .catch(() => {});
    });
  }, [conversation?.id, messages.length, user?.id]);

  // Typing indicator from conversation realtime
  useEffect(() => {
    const t = conversation?.typing_at
      ? new Date(conversation.typing_at).getTime()
      : 0;
    const active = t && Date.now() - t < 4000 && conversation.typing_user_id !== user?.id;
    setTyping(active);
    if (active) {
      const remaining = 4000 - (Date.now() - t);
      const to = setTimeout(() => setTyping(false), Math.max(remaining, 500));
      return () => clearTimeout(to);
    }
  }, [conversation?.typing_at, conversation?.typing_user_id, user?.id]);

  const setTypingState = (on) => {
    if (!conversation) return;
    if (on && !isTypingSent.current) {
      isTypingSent.current = true;
      base44.entities.Conversation
        .update(conversation.id, {
          typing_user_id: user.id,
          typing_at: new Date().toISOString(),
        })
        .catch(() => {});
    } else if (!on && isTypingSent.current) {
      isTypingSent.current = false;
      base44.entities.Conversation
        .update(conversation.id, { typing_user_id: null, typing_at: null })
        .catch(() => {});
    }
  };

  const onDraftChange = (e) => {
    setDraft(e.target.value);
    setTypingState(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTypingState(false), 2500);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending || !conversation) return;
    setSending(true);
    setDraft("");
    setShowEmoji(false);
    clearTimeout(typingTimer.current);
    isTypingSent.current = false;
    setTypingState(false);
    try {
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        participant_ids: conversation.participant_ids,
        sender_id: user.id,
        sender_name: myName,
        text,
        read_by: [user.id],
        reply_to_id: replyTo?.id || null,
      });
      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: text,
        last_message_at: new Date().toISOString(),
        typing_user_id: null,
        typing_at: null,
      });
      setReplyTo(null);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
      setDraft(text);
    }
    setSending(false);
  };

  const sendImage = async (file) => {
    if (!file || !conversation) return;
    setSending(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        participant_ids: conversation.participant_ids,
        sender_id: user.id,
        sender_name: myName,
        text: "",
        image_url: res.file_url,
        read_by: [user.id],
      });
      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: "📷 Photo",
        last_message_at: new Date().toISOString(),
      });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSending(false);
  };

  const openPhoto = (m) => {
    const imgs = messages.filter((x) => x.image_url).map((x) => x.image_url);
    const idx = imgs.indexOf(m.image_url);
    setViewer({ images: imgs, index: idx < 0 ? 0 : idx });
  };

  const deleteMessage = async (m) => {
    try {
      await base44.entities.Message.delete(m.id);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  // Long-press / right-click to open the action menu
  const openMenuAt = (m, pos) => setMenu({ msg: m, x: pos.x, y: pos.y });
  const onPointerDownMenu = (e, m) => {
    pressPoint.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(
      () => openMenuAt(m, pressPoint.current),
      500
    );
  };
  const cancelPress = () => clearTimeout(pressTimer.current);
  const onContextMenuMenu = (e, m) => {
    e.preventDefault();
    openMenuAt(m, { x: e.clientX, y: e.clientY });
  };

  if (!conversation) {
    return (
      <div className="py-20 text-center text-foreground/50">
        Conversation introuvable.
      </div>
    );
  }

  const otherParticipants = (conversation.participant_ids || []).filter(
    (id) => id !== user.id
  );
  const readByAll = (m) =>
    otherParticipants.length > 0 &&
    otherParticipants.every((uid) => (m.read_by || []).includes(uid));
  const repliedOf = (id) => messages.find((x) => x.id === id);
  const readersOf = (m) =>
    otherParticipants
      .filter((uid) => (m.read_by || []).includes(uid))
      .map((uid) => profiles.find((p) => p.created_by_id === uid))
      .filter(Boolean);

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] md:h-[calc(100dvh-10rem)] rounded-[1.5rem] border border-border bg-background overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 bg-background/85 backdrop-blur-xl border-b border-border px-3 py-2.5">
        <button
          onClick={onBack}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted shrink-0"
          aria-label="Retour"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Avatar name={title} src={avatarUrl} size={40} online={online} />
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate leading-tight">{title}</div>
          <div className="text-xs text-foreground/50 truncate leading-tight">
            {typing ? (
              <span className="text-primary font-medium">en train d'écrire…</span>
            ) : (
              statusText
            )}
          </div>
        </div>
        {isGroup && (
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted shrink-0"
            aria-label="Paramètres du groupe"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-1 selectable"
      >
        {messages.map((m, i) => {
          const mine = m.sender_id === user.id;
          const replied = m.reply_to_id ? repliedOf(m.reply_to_id) : null;
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const sameSender = prev && prev.sender_id === m.sender_id;
          const gap = prev
            ? new Date(m.created_date).getTime() -
              new Date(prev.created_date).getTime()
            : Infinity;
          const grouped = sameSender && gap <= 60000;
          const nextSame =
            next && next.sender_id === m.sender_id &&
            new Date(next.created_date).getTime() -
              new Date(m.created_date).getTime() <=
              60000;
          const isLastOfGroup = !nextSame;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"} animate-float-in ${
                grouped ? "mt-0.5" : "mt-2.5"
              }`}
            >
              <div className="max-w-[82%] md:max-w-md">
                {!grouped && (
                  <div
                    className={`text-[0.6875rem] text-foreground/45 mb-1 ${
                      mine ? "text-right" : "text-left"
                    }`}
                  >
                    {fmtTime(m.created_date)}
                  </div>
                )}
                {replied && (
                  <div
                    className={`mb-1 rounded-lg px-2.5 py-1 text-xs border-l-2 ${
                      mine
                        ? "border-white/60 bg-white/10 text-white/70"
                        : "border-primary bg-primary/10 text-foreground/70"
                    }`}
                  >
                    <div className="font-bold">{replied.sender_name || "Membre"}</div>
                    <div className="truncate">
                      {replied.text || (replied.image_url ? "📷 Photo" : "")}
                    </div>
                  </div>
                )}
                <div
                  onPointerDown={(e) => onPointerDownMenu(e, m)}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  onPointerCancel={cancelPress}
                  onContextMenu={(e) => onContextMenuMenu(e, m)}
                  className={`w-fit max-w-full rounded-2xl px-4 py-2.5 cursor-pointer select-none transition active:scale-[0.99] ${
                    mine
                      ? "brand-gradient text-white rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  } ${
                    grouped
                      ? mine
                        ? "rounded-br-md"
                        : "rounded-bl-md"
                      : ""
                  }`}
                >
                  {isGroup && !mine && !grouped && (
                    <div className="text-xs font-bold text-primary mb-0.5">
                      {m.sender_name || "Membre"}
                    </div>
                  )}
                  {m.image_url && (
                    <button
                      type="button"
                      onClick={() => openPhoto(m)}
                      className="block rounded-xl overflow-hidden mb-1 max-w-[220px] focus:outline-none"
                      aria-label="Agrandir la photo"
                    >
                      <Image
                        src={m.image_url}
                        fittingType="fill"
                        className="w-full h-44"
                      />
                    </button>
                  )}
                  {m.text && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  )}
                </div>
                {mine && isLastOfGroup && (
                  <ReadReceipts
                    readers={readersOf(m)}
                    allRead={readByAll(m)}
                  />
                )}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex items-center gap-1 px-2 py-1">
            <span
              className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="border-t border-border bg-muted/50 px-3 py-2 flex items-center gap-2">
          <Reply className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-primary">
              {replyTo.sender_name || "Membre"}
            </div>
            <div className="text-xs text-foreground/60 truncate">
              {replyTo.text || (replyTo.image_url ? "📷 Photo" : "")}
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted"
            aria-label="Annuler la réponse"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="relative bg-background/85 backdrop-blur-xl border-t border-border">
        {showEmoji && (
          <div className="absolute bottom-full left-2 right-2 mb-2">
            <EmojiPicker onPick={(em) => setDraft((d) => d + em)} />
          </div>
        )}
        <div className="p-3 flex items-center gap-2">
          <button
            onClick={() => setShowEmoji((s) => !s)}
            className={`h-10 w-10 grid place-items-center rounded-full hover:bg-muted shrink-0 transition ${
              showEmoji ? "text-primary bg-muted" : "text-foreground/60"
            }`}
            aria-label="Emojis"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="h-10 w-10 grid place-items-center rounded-full hover:bg-muted shrink-0 text-foreground/60"
            aria-label="Image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              sendImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            value={draft}
            onChange={onDraftChange}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={(!draft.trim() && !sending) || sending}
            className="h-10 w-10 rounded-full brand-gradient text-white grid place-items-center disabled:opacity-50 shrink-0 active:scale-95 transition"
            aria-label="Envoyer"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {menu && (
        <MessageActionMenu
          position={{ x: menu.x, y: menu.y }}
          mine={menu.msg.sender_id === user.id}
          onReply={() => setReplyTo(menu.msg)}
          onCopy={() => {
            if (menu.msg.text)
              navigator.clipboard
                ?.writeText(menu.msg.text)
                .catch(() => {});
          }}
          onDelete={() => deleteMessage(menu.msg)}
          onClose={() => setMenu(null)}
        />
      )}

      {isGroup && (
        <GroupSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          conversation={conversation}
          user={user}
          profiles={profiles}
          onUpdated={onRefresh}
        />
      )}

      {viewer && (
        <PhotoViewer
          images={viewer.images}
          index={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}