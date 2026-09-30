import assert from "node:assert/strict";
import test from "node:test";
import {
  canShowMessageNotification,
  countUnreadMessages,
  groupMessagesByConversation,
  isRenderableMessage,
  isUnreadIncomingMessage,
} from "./messageNotifications.js";

test("zero-only placeholder messages are not displayed or counted as unread", () => {
  const placeholder = {
    text: "0",
    sender_id: "sender",
    conversation_id: "one",
    read_by: [],
  };
  assert.equal(isRenderableMessage(placeholder), false);
  assert.equal(isRenderableMessage({ ...placeholder, text: 0 }), false);
  assert.equal(isRenderableMessage({ ...placeholder, text: " 0 " }), false);
  assert.equal(isRenderableMessage({ ...placeholder, text: "0 message" }), true);
  assert.equal(countUnreadMessages([placeholder], "receiver"), 0);
  assert.deepEqual(groupMessagesByConversation([placeholder]), {});
  assert.equal(
    isRenderableMessage({ ...placeholder, text: "0", image_url: "photo.jpg" }),
    true
  );
});

test("unread messages include only incoming messages not yet read by this user", () => {
  const messages = [
    { text: "Bonjour", sender_id: "sender", read_by: ["sender"] },
    { text: "Salut", sender_id: "receiver", read_by: ["receiver"] },
    { text: "Merci", sender_id: "sender", read_by: ["sender", "receiver"] },
  ];

  assert.equal(isUnreadIncomingMessage(messages[0], "receiver"), true);
  assert.equal(countUnreadMessages(messages, "receiver"), 1);
});

test("message history is grouped and sorted oldest to newest per conversation", () => {
  const grouped = groupMessagesByConversation([
    { id: "new", text: "B", conversation_id: "one", created_date: "2026-01-02" },
    { id: "other", text: "C", conversation_id: "two", created_date: "2026-01-01" },
    { id: "old", text: "A", conversation_id: "one", created_date: "2026-01-01" },
  ]);

  assert.deepEqual(grouped.one.map((message) => message.id), ["old", "new"]);
  assert.deepEqual(grouped.two.map((message) => message.id), ["other"]);
});

test("message notification preferences independently suppress in-app alerts", () => {
  assert.equal(canShowMessageNotification({ in_app_messages: true }, {}), true);
  assert.equal(
    canShowMessageNotification(
      { in_app_messages: true },
      { notifications_enabled: true, notif_messages: false }
    ),
    false
  );
  assert.equal(
    canShowMessageNotification(
      { in_app_messages: false },
      { notifications_enabled: true, notif_messages: true }
    ),
    false
  );
});
