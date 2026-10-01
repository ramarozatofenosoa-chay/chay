const HAS_TIME_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export function parseTimestamp(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;

  const input = typeof value === "string" && value.trim() ? value.trim() : value;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}T/.test(input) && !HAS_TIME_ZONE.test(input)) {
    const date = new Date(`${input}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTimestamp(value, { date = true, time = true } = {}) {
  const parsed = parseTimestamp(value);
  if (!parsed) return "";

  const options = {};
  if (date) Object.assign(options, { day: "numeric", month: "short" });
  if (time) Object.assign(options, { hour: "2-digit", minute: "2-digit" });
  return parsed.toLocaleString("fr-FR", options);
}
