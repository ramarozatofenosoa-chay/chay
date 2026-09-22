import { useEffect } from "react";

// Compteur global des overlays actuellement ouverts dans l'app.
// Permet au bouton retour matériel de savoir s'il doit d'abord fermer une
// modale (priorité 2) avant de reculer dans la pile de navigation (priorité 3),
// sans dépendre d'une détection fragile du DOM.
let openCount = 0;

export function hasOpenModal() {
  return openCount > 0;
}

/**
 * À utiliser dans tout composant qui affiche une superposition (modale, sheet,
 * bottom sheet, menu plein écran, visionneuse, lecteur plein écran, appel…).
 *
 * - Quand `open` est vrai : incrémente le compteur global et écoute l'événement
 *   `close-modal-request` (émis par le bouton retour matériel) pour appeler
 *   `onClose`.
 * - Au démontage ou fermeture : décrémente le compteur et retire l'écouteur.
 *
 * `open` vaut `true` pour les overlays toujours "ouverts" tant qu'ils sont
 * montés (lecteur plein écran, visionneuse, appel, menu contextuel…).
 */
export function useCloseModalRequest(open, onClose) {
  // Compteur — dépend uniquement de `open` (stable), pas de `onClose`.
  useEffect(() => {
    if (!open) return;
    openCount += 1;
    return () => {
      openCount = Math.max(0, openCount - 1);
    };
  }, [open]);

  // Écouteur de fermeture — dépend de `open` et `onClose`.
  useEffect(() => {
    if (!open) return;
    const handler = () => {
      if (typeof onClose === "function") onClose();
    };
    window.addEventListener("close-modal-request", handler);
    return () => window.removeEventListener("close-modal-request", handler);
  }, [open, onClose]);
}