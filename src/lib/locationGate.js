// Sonde l'état réel de la localisation de l'appareil (service + permission),
// indépendamment du réseau : fonctionne aussi bien hors ligne qu'en ligne.
// `nav` est injectable pour les tests (sinon `navigator` global du navigateur).
function getNavigator() {
  return typeof navigator !== "undefined" ? navigator : undefined;
}

export function isGeolocationSupported(nav = getNavigator()) {
  return !!nav?.geolocation;
}

// Résultat : "active" | "checking" | "denied" | "inactive" | "unsupported"
//  - active      : permission accordée (vérifiée via API Permissions).
//  - checking    : impossible de déterminer l'état (fallback sur getCurrentPosition).
//  - denied      : permission refusée par l'utilisateur/l'OS.
//  - inactive    : service de localisation désactivé ou indisponible.
//  - unsupported : l'appareil/navigateur n'expose pas l'API Geolocation.
//
// Stratégie : on privilégie l'API Permissions qui reflète l'état réel de la
// permission dans le système. Si elle n'est pas disponible ou si elle renvoie
// "prompt", on fallback sur getCurrentPosition pour décider.
export function probeLocationStatus(nav = getNavigator(), { timeout = 8000, maximumAge = 300000 } = {}) {
  return new Promise((resolve) => {
    if (!nav?.geolocation) {
      resolve("unsupported");
      return;
    }

    // Essaie d'abord l'API Permissions (plus fiable, instantané).
    if (nav?.permissions?.query) {
      nav.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "granted") {
            // Permission accordée : le service est activé.
            resolve("active");
          } else if (result.state === "denied") {
            resolve("denied");
          } else {
            // "prompt" ou état inconnu : fallback sur getCurrentPosition.
            resolve(checkPosition(nav, timeout, maximumAge));
          }
        })
        .catch(() => {
          // L'API Permissions a échoué : fallback.
          resolve(checkPosition(nav, timeout, maximumAge));
        });
    } else {
      // Pas d'API Permissions : fallback sur getCurrentPosition.
      resolve(checkPosition(nav, timeout, maximumAge));
    }
  });
}

// Fallback : demande une position réelle pour décider.
function checkPosition(nav, timeout, maximumAge) {
  return new Promise((resolve) => {
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
