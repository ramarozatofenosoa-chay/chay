import { useState } from "react";

/**
 * File d'attente de publication (« à publier »).
 *
 * On ajoute autant d'entrées que voulu dans la fenêtre — rien n'est envoyé au
 * serveur — puis un seul « Publier » les écrit toutes d'un coup.
 *
 * La file vit dans l'état du composant : elle survit à la fermeture de la
 * fenêtre (fermer, revenir, tout y est toujours), mais pas au rechargement de
 * la page.
 *
 * @param entity     handler Base44 (base44.entities.Devotional, …)
 * @param dateField  champ date de l'entité (« reading_date » ou « date »)
 * @param build      (draft) => payload serveur
 * @param resolveId  (draft, prev, server) => id de l'entrée à mettre à jour,
 *                   undefined pour en créer une, null pour refuser la date
 *                   (déjà occupée par une autre entrée)
 */
export default function useStagedPublish({
  entity,
  dateField,
  build,
  resolveId,
}) {
  const [pending, setPending] = useState([]);
  const [publishing, setPublishing] = useState(false);

  const atDate = (list, day) =>
    (Array.isArray(list) ? list : []).find((e) => e && e[dateField] === day) ||
    null;

  // Ajoute (ou remplace) l'entrée du jour dans la file. Rien n'est envoyé.
  const stage = (draft, serverEntries, blockedMessage) => {
    const day = draft[dateField];
    const prev = atDate(pending, day);
    const server = atDate(serverEntries, day);
    const id = resolveId(draft, prev, server);
    if (id === null) {
      return { ok: false, error: blockedMessage || "Date déjà occupée" };
    }
    const others = pending.filter((p) => p[dateField] !== day);
    setPending([...others, { ...draft, id, __pending: true }]);
    return { ok: true, pendingCount: others.length + 1 };
  };

  // Retire de la file l'entrée du jour ; renvoie ce qui a été retiré.
  const discard = (day) => {
    const removed = atDate(pending, day);
    if (removed) setPending((list) => list.filter((p) => p[dateField] !== day));
    return removed;
  };

  // Écrit toute la file d'un coup. Les écritures partent en parallèle ; celles
  // qui échouent restent dans la file pour être retentées.
  const publish = async (serverEntries) => {
    const list = [...pending];
    if (!list.length) return { ok: 0, failed: 0 };
    setPublishing(true);
    try {
      const results = await Promise.allSettled(
        list.map(async (entry) => {
          const server = atDate(serverEntries, entry[dateField]);
          const id = resolveId(entry, null, server);
          if (id === null) {
            throw new Error("Date déjà occupée par une autre entrée");
          }
          const payload = build(entry);
          if (id) await entity.update(id, payload);
          else await entity.create(payload);
        })
      );
      const failed = results
        .map((r, i) => (r.status === "rejected" ? i : -1))
        .filter((i) => i >= 0)
        .map((i) => list[i]);
      setPending(failed);
      return { ok: list.length - failed.length, failed: failed.length };
    } finally {
      setPublishing(false);
    }
  };

  return { pending, publishing, stage, discard, publish };
}
