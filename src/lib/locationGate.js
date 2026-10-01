// Sonde l'état réel de la localisation de l'appareil (service + permission),
// indépendamment du réseau : fonctionne aussi bien hors ligne qu'en ligne.
// `nav` est injectable pour les tests (sinon `navigator` global du navigateur).
function getNavigator() {
  return typeof navigator !== "undefined" ? navigator : undefined;
}

export function isGeolocationSupported(nav = getNavigator()) {
  return !!nav?.geolocation;
}

// Résultat : "active" | "denied" | "inactive" | "unsupported"
//  - active      : position obtenue, la localisation est bien activée.
//  - denied      : permission refusée par l'utilisateur/l'OS.
//  - inactive    : service de localisation désactivé ou indisponible
//                   (POSITION_UNAVAILABLE / TIMEOUT).
//  - unsupported : l'appareil/navigateur n'expose pas l'API Geolocation.
export function probeLocationStatus(nav = getNavigator(), { timeout = 8000, maximumAge = 300000 } = {}) {
  return new Promise((resolve) => {
    if (!nav?.geolocation) {
      resolve("unsupported");
      return;
    }
    nav.geolocation.getCurrentPosition(
      () => resolve("active"),
      (error) => resolve(error?.code === 1 ? "denied" : "inactive"),
      { enableHighAccuracy: false, timeout, maximumAge }
    );
  });
}

// S'abonne aux changements de permission "geolocation" (API Permissions),
// quand le navigateur le permet. Renvoie une fonction de désabonnement.
export function subscribeToGeolocationPermission(onChange, nav = getNavigator()) {
  if (!nav?.permissions?.query) return () => {};
  let status;
  let cancelled = false;
  nav.permissions
    .query({ name: "geolocation" })
    .then((result) => {
      if (cancelled) return;
      status = result;
      status.onchange = () => onChange(status.state);
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    if (status) status.onchange = null;
  };
}
