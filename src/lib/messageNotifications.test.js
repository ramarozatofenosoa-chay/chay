import assert from "node:assert/strict";
import test from "node:test";
import {
  canShowMessageNotification,
  countUnreadMessages,
  groupMessagesByConversation,
  isUnreadIncomingMessage,
} from "./messageNotifications.js";

test("unread messages include only incoming messages not yet read by this user", () => {
  const messages = [
    { sender_id: "sender", read_by: ["sender"] },
    { sender_id: "receiver", read_by: ["receiver"] },
    { sender_id: "sender", read_by: ["sender", "receiver"] },
  ];

  assert.equal(isUnreadIncomingMessage(messages[0], "receiver"), true);
  assert.equal(countUnreadMessages(messages, "receiver"), 1);
});

test("message history is grouped and sorted oldest to newest per conversation", () => {
  const grouped = groupMessagesByConversation([
    { id: "new", conversation_id: "one", created_date: "2026-01-02" },
    { id: "other", conversation_id: "two", created_date: "2026-01-01" },
    { id: "old", conversation_id: "one", created_date: "2026-01-01" },
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
