import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Video } from "lucide-react";
import VideoCall from "@/components/community/VideoCall";

export default function ChatRoom({ user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const endRef = useRef(null);

  const myName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "Membre";

  useEffect(() => {
    (async () => {
      const msgs = await base44.entities.ChatMessage
        .list("created_date", 100)
        .catch(() => []);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setLoading(false);
    })();
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === "create") {
        setMessages((m) =>
          m.some((x) => x.id === event.data.id) ? m : [...m, event.data]
        );
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        room_id: "general",
        text: draft.trim(),
        author_name: myName,
      });
      setDraft("");
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-extrabold text-lg">Chat en direct</h2>
        <button
          onClick={() => setCallOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:scale-105 transition"
        >
          <Video className="h-4 w-4" /> Appel vidéo
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-border bg-card p-4 h-80 overflow-y-auto flex flex-col gap-2 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-foreground/50 py-10 text-sm">
            Soyez le premier à écrire un mot d'encouragement !
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.author_name === myName;
            return (
              <div
                key={m.id}
                className={`max-w-[80%] ${mine ? "self-end" : "self-start"}`}
              >
                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </div>
                <div
                  className={`text-[10px] text-muted-foreground mt-0.5 ${
                    mine ? "text-right" : ""
                  }`}
                >
                  {mine ? "Vous" : m.author_name} ·{" "}
                  {new Date(m.created_date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Écrivez un message…"
          className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="h-12 w-12 grid place-items-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition disabled:opacity-50 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {callOpen && (
        <VideoCall room="chay-communaute" onClose={() => setCallOpen(false)} />
      )}
    </div>
  );
}