import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  Send,
  Phone,
  Video,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";
import Avatar from "@/components/messages/Avatar";
import CallOverlay from "@/components/messages/CallOverlay";
import { isOnline, lastSeenLabel } from "@/hooks/usePresence";

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
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [call, setCall] = useState(null);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
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

  // Scroll to bottom on new messages
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
    const t = conversation?.typing_at ? new Date(conversation.typing_at).getTime() : 0;
    const active =
      t && Date.now() - t < 4000 && conversation.typing_user_id !== user?.id;
    setTyping(active);
    if (active) {
      const remaining = 4000 - (Date.now() - t);
      const to = setTimeout(() => setTyping(false), Math.max(remaining, 500));
      return () => clearTimeout(to);
    }
  }, [conversation?.typing_at, conversation?.typing_user_id, user?.id]);

  const setTypingState = async (on) => {
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
    clearTimeout(typingTimer.current);
    isTypingSent.current = false;
    const name =
      user?.full_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      "Membre";
    try {
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        participant_ids: conversation.participant_ids,
        sender_id: user.id,
        sender_name: name,
        text,
        read_by: [user.id],
      });
      await base44.entities.Conversation.update(conversation.id, {
        last_message_text: text,
        last_message_at: new Date().toISOString(),
        typing_user_id: null,
        typing_at: null,
      });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
      setDraft(text);
    }
    setSending(false);
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
        <button
          onClick={() => setCall({ mode: "audio" })}
          className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted shrink-0"
          aria-label="Appel audio"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCall({ mode: "video" })}
          className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted shrink-0"
          aria-label="Appel vidéo"
        >
          <Video className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2 selectable"
      >
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                  mine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                }`}
              >
                {isGroup && !mine && (
                  <div className="text-xs font-bold text-primary mb-0.5">
                    {m.sender_name || "Membre"}
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {m.text}
                </div>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="text-[10px] opacity-70">
                    {fmtTime(m.created_date)}
                  </span>
                  {mine &&
                    (readByAll(m) ? (
                      <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
                    ) : (
                      <Check className="h-3.5 w-3.5 opacity-70" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="text-xs text-foreground/50 px-2 italic">
            en train d'écrire…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border p-3 flex items-center gap-2">
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
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-50 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {call && (
        <CallOverlay
          room={`chay-conv-${conversation.id}`}
          mode={call.mode}
          label={title}
          onClose={() => setCall(null)}
        />
      )}
    </div>
  );
}