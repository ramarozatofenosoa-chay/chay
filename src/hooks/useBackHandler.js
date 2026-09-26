import { useEffect, useRef } from "react";

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
//     de l'effet retire l'entrée synthétique restante si on était la dernière.
//   - Plus aucune superposition + retour : comportement natif (l'historique
//     recule réellement, ou l'app se ferme à la racine — comportement WebView
//     standard, sans plugin requis).
// ─────────────────────────────────────────────────────────────────────────

const MARKER = { chayOverlay: true };
const closers = []; // pile des callbacks de fermeture (sommet = overlay le plus profond)
const POP_KEY = "__chay_popstate_installed__";

function onPopState(event) {
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
    window.history.pushState(MARKER, "");
  }
}

function ensurePopListener() {
  if (window[POP_KEY]) return;
  window.addEventListener("popstate", onPopState);
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

  useEffect(() => {
    if (!open) return;
    ensurePopListener();

    const close = () => {
      try { onCloseRef.current && onCloseRef.current(); } catch {}
    };

    const wasEmpty = closers.length === 0;
    closers.push(close);

    if (wasEmpty) {
      // Première superposition : on empile une entrée d'historique pour
      // intercepter le prochain "retour".
      window.history.pushState(MARKER, "");
    }

    return () => {
      const i = closers.indexOf(close);
      if (i !== -1) closers.splice(i, 1);

      // Si on vient de fermer la dernière superposition et que notre entrée
      // synthétique est encore en tête d'historique, on la retire pour ne pas
      // laisser une entrée fantôme qui causerait un "retour" fantôme plus tard.
      if (closers.length === 0) {
        const st = window.history.state;
        if (st && typeof st === "object" && st.chayOverlay) {
          // Remplacer l'entrée orpheline sans déclencher de navigation
          // supplémentaire (history.back() causait un double retour).
          window.history.replaceState(null, "");
        }
      }
    };
  }, [open]);
}

// Compatibilité : ancien nom de hook utilisé dans les primitives/overlays.
export const useCloseModalRequest = useBackHandler;
export { hasOpenOverlay as hasOpenModal };