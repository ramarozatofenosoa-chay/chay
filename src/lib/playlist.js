export function isValidPlaylistImageUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function formatListenCount(count) {
  const num = Number(count);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num === 1 ? "1 écoute" : `${num} écoutes`;
}
