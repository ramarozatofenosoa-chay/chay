import { useEffect, useRef, useLayoutEffect } from "react";
import {
  createOverlayHistoryState,
  OVERLAY_HISTORY_KEY,
} from "@/lib/backNavigation";

// ─────────────────────────────────────────────────────────────────────────
// Gestion du bouton retour via l'History API du navigateur.
//
// Fonctionne dans N'importe quelle WebView (PWA ou app hybride), AVEC ou SANS
// le plugin @capacitor/app : on n'utilise aucune API native. C'est la méthode
// standard pour intercepter le bouton retour matériel / le bouton retour du
// navigateur et fermer une superposition (modale, sheet, drawer, visionneuse,
// lecteur plein écran, appel…) au lieu de naviguer en arrière.
//
// Principe :
//   - Quand la 1re superposition s'ouvre, on pousse une entrée d'historique
//     synthétique (`pushState`). Le bouton retour fait alors reculer l'historique
//     d'un cran (popstate) : on intercepte et on ferme la superposition
//     supérieure au lieu de changer de page.
//   - Les superpositions imbriquées partagent cette unique entrée ; chaque
//     "retour" ferme la plus profonde, et on repousse l'entrée tant qu'il en
//     reste, pour pouvoir enchaîner.
//   - Fermeture par bouton (X) : le parent passe `open` à false ; le nettoyage
//     de l'effet dépile l'entrée synthétique restante si on était la dernière.
//   - Plus aucune superposition + retour : comportement natif (l'historique
//     recule réellement, ou l'app se ferme à la racine — comportement WebView
//     standard, sans plugin requis).
// ─────────────────────────────────────────────────────────────────────────

const closers = [];
const POP_KEY = "__chay_popstate_installed__";
const POP_LISTENER_KEY = "__chay_popstate_listener__";
// Clé (non énumérable) posée sur l'entrée d'historique synthétique pour
// mémoriser le closer déjà déclenché : évite les doubles fermetures quand un
// cleanup React se relance (HMR, re-render) avant que le popstate effectif
// n'arrive. Non énumérable => jamais sérialisée par structuredClone du
// navigateur ni copiée dans les entrées suivantes.
const PROCESSED_STATE_KEY = Symbol("chayOverlayProcessed");

function onPopState(event) {
  const st = window.history.state;
  // Si une fermeture par bouton X / Échap a déjà appelé onClose() pour cette
  // entrée synthétique (history.back() en cours de traitement), le popstate
  // qui arrive ne doit RIEN faire : pas de re-fermeture, pas de pushState.
  if (st && typeof st === "object" && st[PROCESSED_STATE_KEY]) {
    delete st[PROCESSED_STATE_KEY];
    return;
  }
  if (closers.length === 0) {
    // Entrée MARKER orpheline : quand le navigateur revient sur
    // cette entrée, le popstate a déjà été traité par React Router
    // (on est déjà sur la bonne page). On ne fait plus appel à
    // history.back() pour éviter la double navigation.
    return;
  }
  const close = closers.pop();
  try { close(); } catch {}
  // S'il reste des superpositions ouvertes, on repousse l'entrée synthétique
  // pour que le prochain "retour" ferme la suivante au lieu de quitter la page.
  if (closers.length > 0) {
    window.history.pushState(
      createOverlayHistoryState(window.history.state),
      ""
    );
  }
}

function ensurePopListener() {
  // Toujours retirer l'ancien listener (HMR peut avoir laissé une référence
  // obsolète) et installer le listener courant du module.
  if (window[POP_LISTENER_KEY]) {
    window.removeEventListener("popstate", window[POP_LISTENER_KEY]);
  }
  window.addEventListener("popstate", onPopState);
  window[POP_LISTENER_KEY] = onPopState;
  window[POP_KEY] = true;
}

export function hasOpenOverlay() {
  return closers.length > 0;
}

/**
 * useBackHandler(open, onClose)
 *
 * Quand `open` est vrai, enregistre `onClose` afin que le bouton retour
 * (matériel Android, retour navigateur, ou swipe iOS quand le WebView le
 * propage) ferme CETTE superposition au lieu de naviguer en arrière.
 *
 * `onClose` est lu via une ref : aucune re-souscription quand son identité
 * change (les lecteurs re-render fréquemment).
 */
export function useBackHandler(open, onClose) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Ref pour savoir si le listener du module courant est installé.
  // Après HMR, la référence de onPopState change mais useEffect [open]
  // ne se relance pas si open est déjà vrai → on utilise ce ref pour
  // forcer la réinstallation du bon listener.
  const installedRef = useRef(false);
  useLayoutEffect(() => {
    if (!installedRef.current || window[POP_LISTENER_KEY] !== onPopState) {
      ensurePopListener();
      installedRef.current = true;
    }
  });

  useEffect(() => {
    if (!open) return;
    const close = () => {
      try { onCloseRef.current && onCloseRef.current(); } catch {}
    };

    const wasEmpty = closers.length === 0;
    closers.push(close);

    if (wasEmpty) {
      // Première superposition : on empile une entrée d'historique pour
      // intercepter le prochain "retour". Preserve React Router's state and
      // index so its POP handling remains consistent on mobile browsers.
      window.history.pushState(
        createOverlayHistoryState(window.history.state),
        ""
      );
    }

    return () => {
      const i = closers.indexOf(close);
      if (i !== -1) closers.splice(i, 1);

      // Fermeture par bouton X / Échap : si l'entrée synthétique créée par ce
      // hook est toujours en tête d'historique, on la dépile — qu'il reste ou
      // non d'autres superpositions ouvertes. Sans ce dépilement, les entrées
      // s'accumulent ("fantômes") et le bouton retour doit être pressé
      // plusieurs fois avant de réellement naviguer → le retour semble
      // aléatoire ("marche et ne marche pas").
      // Quand la fermeture provient du popstate, le navigateur est déjà sur
      // l'entrée réelle : rien à faire ici.
      const st = window.history.state;
      if (st && typeof st === "object" && st[OVERLAY_HISTORY_KEY]) {
        // Marquer `close` comme traité évite tout doublon si le cleanup se
        // relance (re-render strict mode / HMR) avant le popstate effectif.
        st[PROCESSED_STATE_KEY] = close;
        window.history.back();
      }
    };
  }, [open]);
}

// Compatibilité : ancien nom de hook utilisé dans les primitives/overlays.
export const useCloseModalRequest = useBackHandler;
export { hasOpenOverlay as hasOpenModal };
