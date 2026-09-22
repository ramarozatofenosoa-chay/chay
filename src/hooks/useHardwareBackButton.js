import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { hasOpenModal } from "@/hooks/useCloseModalRequest";

// Gère le bouton retour matériel (Android) et l'événement backButton (iOS).
// Inscription unique au niveau racine de l'app (composant rendu à l'intérieur
// du <Router>), jamais par écran.
//
// Priorité d'interception :
//   1. Clavier ouvert  -> blur du champ actif (ferme le clavier) et stop.
//   2. Modale/overlay ouvert -> émet "close-modal-request" (les overlays
//      abonnés via useCloseModalRequest se ferment) et stop.
//   3. Route non racine -> navigate(-1) et stop.
//   4. Racine -> App.minimizeApp() sur Android ; rien sur iOS (comportement
//      natif du swipe).
//
// On ne se fie PAS à `canGoBack` de Capacitor (désynchronisé de la pile
// react-router en SPA) : la décision de navigation se prend via
// useLocation().pathname.
export function useHardwareBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Refs pour garder les dernières valeurs sans réinscrire le listener.
  const navigateRef = useRef(navigate);
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    navigateRef.current = navigate;
    pathnameRef.current = location.pathname;
  });

  useEffect(() => {
    // Inscription sur Android ET iOS (aucun filtrage de plateforme).
    // Sur web, rien à faire.
    if (!Capacitor.isNativePlatform()) return;

    let handle;
    const register = async () => {
      handle = await App.addListener("backButton", () => {
        // 1. Clavier ouvert : rendre le focus au champ actif ferme le clavier.
        const ae = document.activeElement;
        const isField =
          ae &&
          ae !== document.body &&
          (/^(input|textarea|select)$/i.test(ae.tagName) || ae.isContentEditable);
        if (isField) {
          try { ae.blur(); } catch {}
          return;
        }

        // 2. Modale/overlay ouvert : demander la fermeture (compteur global
        //    fiable, pas de devinette du DOM). Les overlays se ferment via
        //    useCloseModalRequest.
        if (hasOpenModal()) {
          window.dispatchEvent(new Event("close-modal-request"));
          return;
        }

        // 3. Navigation : reculer d'un cran sauf à la racine.
        if (pathnameRef.current !== "/") {
          navigateRef.current(-1);
          return;
        }

        // 4. Racine : minimiser sur Android, comportement natif sur iOS.
        if (Capacitor.getPlatform() === "android") {
          try { App.minimizeApp(); } catch {}
        }
        // iOS : ne rien faire (swipe natif géré à part).
      });
    };
    register();

    return () => {
      if (handle && typeof handle.remove === "function") handle.remove();
    };
  }, []);
}