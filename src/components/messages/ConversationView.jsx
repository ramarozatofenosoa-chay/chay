import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  Send,
  Loader2,
  Check,
  CheckCheck,
  Reply,
  Trash2,
  Image as ImageIcon,
  X,
  Smile,
  Settings,
} from "lucide-react";
import Avatar from "@/components/messages/Avatar";
import { Image } from "@/components/ui/image";
import { isOnline, lastSeenLabel } from "@/hooks/usePresence";
import GroupSettingsSheet from "@/components/messages/GroupSettingsSheet";

const EMOJIS = ["😀", "🙏", "❤️", "🕊️", "✨", "🙌", "👍", "😍"];

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
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingSent = useRef(false);

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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    const t = conversation?.typing_at ? new Date(conversation.typing_at).getTime() : 0;
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

  const deleteMessage = async (m) => {
    try {
      await base44.entities.Message.delete(m.id);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
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

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] md:h-[calc(100dvh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-xl border-b border-border px-2 py-2.5">
        <button
          onClick={onBack}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted shrink-0"
          aria-label="Retour"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Avatar name={title} src={avatarUrl} size={40} online={online} />
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{title}</div>
          <div className="text-xs text-foreground/50 truncate">{statusText}</div>
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
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2 selectable"
      >
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          const replied = m.reply_to_id ? repliedOf(m.reply_to_id) : null;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[82%]">
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
                  className={`rounded-2xl px-3.5 py-2 ${
                    mine
                      ? "brand-gradient text-white rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  }`}
                >
                  {isGroup && !mine && (
                    <div className="text-xs font-bold text-primary mb-0.5">
                      {m.sender_name || "Membre"}
                    </div>
                  )}
                  {m.image_url && (
                    <div className="rounded-xl overflow-hidden mb-1 max-w-[220px]">
                      <Image src={m.image_url} fittingType="fill" className="w-full h-44" />
                    </div>
                  )}
                  {m.text && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  )}
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <span className="text-[10px] opacity-70">{fmtTime(m.created_date)}</span>
                    {mine &&
                      (readByAll(m) ? (
                        <CheckCheck className="h-3.5 w-3.5 text-white/90" />
                      ) : (
                        <Check className="h-3.5 w-3.5 opacity-70" />
                      ))}
                  </div>
                </div>
                <div className={`mt-0.5 flex items-center gap-2 ${mine ? "justify-end" : ""}`}>
                  <button
                    onClick={() => setReplyTo(m)}
                    className="text-[10px] font-semibold text-foreground/50 hover:text-primary inline-flex items-center gap-0.5"
                  >
                    <Reply className="h-3 w-3" /> Répondre
                  </button>
                  {mine && (
                    <button
                      onClick={() => deleteMessage(m)}
                      className="text-[10px] font-semibold text-foreground/50 hover:text-destructive inline-flex items-center gap-0.5"
                    >
                      <Trash2 className="h-3 w-3" /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="text-xs text-foreground/50 px-2 italic">en train d'écrire…</div>
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

      {/* Emoji bar */}
      {showEmoji && (
        <div className="border-t border-border bg-card px-3 py-2 flex gap-1 overflow-x-auto no-scrollbar">
          {EMOJIS.map((em) => (
            <button
              key={em}
              onClick={() => setDraft((d) => d + em)}
              className="text-2xl px-1.5 py-1 hover:bg-muted rounded-lg"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border p-3 flex items-center gap-2">
        <button
          onClick={() => setShowEmoji((s) => !s)}
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-muted shrink-0"
          aria-label="Emojis"
        >
          <Smile className="h-5 w-5 text-foreground/60" />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-muted shrink-0"
          aria-label="Image"
        >
          <ImageIcon className="h-5 w-5 text-foreground/60" />
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
          disabled={!draft.trim() || sending}
          className="h-10 w-10 rounded-full brand-gradient text-white grid place-items-center disabled:opacity-50 shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

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
    </div>
  );
}