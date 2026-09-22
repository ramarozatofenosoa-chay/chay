import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { hasOpenModal } from "@/hooks/useCloseModalRequest";

// Gère le bouton retour matériel (Android) et l'événement backButton (iOS).
// Inscription unique au niveau racine de l'app (composant rendu à l'intérieur
// du <Router>), jamais par écran.
//
// ⚠️ MODE DÉBOGAGE VISUEL : alert() temporaires à retirer après tests.
// Priorité d'interception :
//   1. Clavier ouvert  -> blur du champ actif (ferme le clavier) et stop.
//   2. Modale/overlay ouvert -> émet "close-modal-request" et stop.
//   3. Route non racine -> navigate(-1) (JAMAIS navigate('/')) et stop.
//   4. Racine -> App.minimizeApp() sur Android ; rien sur iOS.
export function useHardwareBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Refs pour garder les dernières valeurs sans réinscrire le listener
  // (le listener est inscrit une seule fois ; sans refs, location/navigate
  // seraient figés à leur valeur au moment de l'inscription).
  const navigateRef = useRef(navigate);
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    navigateRef.current = navigate;
    pathnameRef.current = location.pathname;
  });

  useEffect(() => {
    // Inscription sur Android ET iOS (aucun filtrage de plateforme).
    if (!Capacitor.isNativePlatform()) return;

    let handle;
    const register = async () => {
      handle = await App.addListener("backButton", () => {
        const ae = document.activeElement;
        const isField =
          ae &&
          ae !== document.body &&
          (/^(input|textarea|select)$/i.test(ae.tagName) || ae.isContentEditable);

        const pathname = pathnameRef.current;
        alert(
          "=== BACK BUTTON PRESSED ===\n" +
          "Active element: " + (ae?.tagName || "none") + "\n" +
          "isField (clavier): " + isField + "\n" +
          "hasOpenModal: " + hasOpenModal() + "\n" +
          "pathname: " + pathname
        );

        // 1. Clavier ouvert : ferme le clavier.
        if (isField) {
          alert("ACTION: blur clavier");
          try { ae.blur(); } catch {}
          return;
        }

        // 2. Modale/overlay ouvert : demander la fermeture.
        if (hasOpenModal()) {
          alert("ACTION: close modal (close-modal-request)");
          window.dispatchEvent(new Event("close-modal-request"));
          return;
        }

        // 3. Navigation : reculer d'un cran sauf à la racine.
        if (pathname !== "/") {
          alert("ACTION: navigate(-1) from " + pathname);
          try {
            navigateRef.current(-1);
          } catch (e) {
            alert("navigate(-1) failed -> history.back()\n" + e);
            window.history.back();
          }
          return;
        }

        // 4. Racine : minimiser sur Android, comportement natif sur iOS.
        alert("ACTION: minimize app (root) — platform: " + Capacitor.getPlatform());
        if (Capacitor.getPlatform() === "android") {
          try { App.minimizeApp(); } catch (e) { alert("minimizeApp failed: " + e); }
        }
      });
    };
    register();

    return () => {
      if (handle && typeof handle.remove === "function") handle.remove();
    };
  }, []);
}