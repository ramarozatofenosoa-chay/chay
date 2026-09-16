import { base44 } from "@/api/base44Client";

// Trouve une conversation directe existante entre deux utilisateurs,
// ou en crée une nouvelle.
export async function findOrCreateDirect(user, otherId) {
  const convos = await base44.entities.Conversation
    .filter({ type: "direct" }, "-updated_date", 200)
    .catch(() => []);
  const list = Array.isArray(convos) ? convos : [];
  const existing = list.find(
    (c) =>
      c.participant_ids &&
      c.participant_ids.length === 2 &&
      c.participant_ids.includes(user.id) &&
      c.participant_ids.includes(otherId)
  );
  if (existing) return existing.id;
  const created = await base44.entities.Conversation.create({
    type: "direct",
    participant_ids: [user.id, otherId],
  });
  return created.id;
}