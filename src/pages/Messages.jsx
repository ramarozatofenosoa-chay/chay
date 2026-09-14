import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { usePresenceHeartbeat, useProfiles } from "@/hooks/usePresence";
import ConversationList from "@/components/messages/ConversationList";
import ConversationView from "@/components/messages/ConversationView";
import NewChatSheet from "@/components/messages/NewChatSheet";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeId = searchParams.get("c");
  const [conversations, setConversations] = useState([]);
  const [messagesByConv, setMessagesByConv] = useState({});
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);

  usePresenceHeartbeat(user);
  const profiles = useProfiles();

  const loadAll = async () => {
    const [convos, msgs] = await Promise.all([
      base44.entities.Conversation.list("-updated_date", 100).catch(() => []),
      base44.entities.Message.list("created_date", 500).catch(() => []),
    ]);
    const cArr = Array.isArray(convos) ? convos : [];
    const mArr = Array.isArray(msgs) ? msgs : [];
    setConversations(cArr);
    const grouped = {};
    mArr.forEach((m) => {
      (grouped[m.conversation_id] ||= []).push(m);
    });
    setMessagesByConv(grouped);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Realtime updates
  useEffect(() => {
    const unsubC = base44.entities.Conversation.subscribe((event) => {
      setConversations((prev) => {
        const map = new Map(prev.map((c) => [c.id, c]));
        if (event.type === "delete") map.delete(event.data.id);
        else map.set(event.data.id, event.data);
        return Array.from(map.values()).sort(
          (a, b) =>
            new Date(b.last_message_at || b.updated_date || 0).getTime() -
            new Date(a.last_message_at || a.updated_date || 0).getTime()
        );
      });
    });
    const unsubM = base44.entities.Message.subscribe((event) => {
      const m = event.data;
      if (!m?.conversation_id) return;
      setMessagesByConv((prev) => {
        const list = prev[m.conversation_id] ? [...prev[m.conversation_id]] : [];
        const idx = list.findIndex((x) => x.id === m.id);
        if (event.type === "delete") {
          if (idx >= 0) list.splice(idx, 1);
        } else if (idx >= 0) {
          list[idx] = m;
        } else {
          list.push(m);
          list.sort(
            (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
          );
        }
        return { ...prev, [m.conversation_id]: list };
      });
    });
    return () => {
      unsubC();
      unsubM();
    };
  }, []);

  const activeConv = conversations.find((c) => c.id === activeId) || null;

  const openConversation = (id) => setSearchParams({ c: id });
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-4 md:py-8">
      {activeId ? (
        <ConversationView
          conversation={activeConv}
          messages={messagesByConv[activeId] || []}
          user={user}
          profiles={profiles}
          onBack={goBack}
        />
      ) : (
        <ConversationList
          user={user}
          conversations={conversations}
          messagesByConv={messagesByConv}
          profiles={profiles}
          loading={loading}
          onOpen={openConversation}
          onNew={() => setNewOpen(true)}
          onRefresh={loadAll}
        />
      )}

      <NewChatSheet
        open={newOpen}
        onOpenChange={setNewOpen}
        user={user}
        profiles={profiles}
        conversations={conversations}
        onCreated={openConversation}
      />
    </div>
  );
}