import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// Gère le bouton retour matériel Android (et le cas échéant l'événement backButton
// iOS) en une seule inscription racine. À utiliser UNE SEULE FOIS, au plus haut
// niveau de l'app (composant rendu à l'intérieur du <Router>), jamais par écran.
//
// Priorité d'interception :
//   1. Clavier ouvert  -> blur du champ actif (ferme le clavier) et stop.
//   2. Modale/sheet/menu ouvert -> fermeture via Escape et stop.
//   3. Historique de navigation non vide -> navigate(-1) et stop.
//   4. Écran racine sans historique -> on n'invoque pas App.exitApp() : l'app
//      reste au premier plan (comportement attendu : ne pas fermer brutalement).
export function useHardwareBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    // backButton est un événement Android (et web). iOS utilise le swipe natif,
    // traité séparément. On n'enregistre rien hors plateformes concernées.
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

    let handle;
    let active = true;

    const register = async () => {
      handle = await App.addListener("backButton", ({ canGoBack }) => {
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

        // 2. Modale / bottom sheet / menu ouvert : fermer via Escape.
        //    Radix Dialog et vaul Sheet répondent à Escape (onOpenChange(false)).
        if (document.querySelector('[role="dialog"], [data-state="open"][role="dialog"]')) {
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
          );
          return;
        }

        // 3. Historique de navigation non vide : reculer d'un cran.
        if (canGoBack) {
          navigate(-1);
          return;
        }

        // 4. Écran racine sans historique : ne rien faire (l'app reste ouverte).
      });
    };
    register();

    return () => {
      active = false;
      if (handle && typeof handle.remove === "function") handle.remove();
    };
  }, [navigate]);
}