export function isUnreadIncomingMessage(message, userId) {
  return Boolean(
    message &&
      userId &&
      message.sender_id !== userId &&
      !(message.read_by || []).includes(userId)
  );
}

export function countUnreadMessages(messages, userId) {
  return (Array.isArray(messages) ? messages : []).filter((message) =>
    isUnreadIncomingMessage(message, userId)
  ).length;
}

export function groupMessagesByConversation(messages) {
  const grouped = {};
  for (const message of Array.isArray(messages) ? messages : []) {
    if (!message?.conversation_id) continue;
    (grouped[message.conversation_id] ||= []).push(message);
  }
  Object.values(grouped).forEach((items) =>
    items.sort(
      (left, right) =>
        new Date(left.created_date || 0).getTime() -
        new Date(right.created_date || 0).getTime()
    )
  );
  return grouped;
}

export function canShowMessageNotification(user, prefs) {
  return (
    user?.in_app_messages !== false &&
    prefs?.notifications_enabled !== false &&
    prefs?.notif_messages !== false
  );
}
