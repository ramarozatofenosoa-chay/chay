const KEY = "chay_active_chat";

export function getActiveChat() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setActiveChat(meta) {
  if (!meta) {
    localStorage.removeItem(KEY);
  } else {
    localStorage.setItem(KEY, JSON.stringify(meta));
  }
  window.dispatchEvent(new CustomEvent("chay-active-chat-change"));
}

export function clearActiveChat() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("chay-active-chat-change"));
}