export function isValidPlaylistImageUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}
