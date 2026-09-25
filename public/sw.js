/* Service worker CHAY — notifications push navigateur.
   Reçoit les pushes envoyés par la fonction backend sendWebPush, les affiche
   en notification système et, au clic, ouvre l'application sur la bonne page.

   Le service worker ne peut pas importer de modules : le mapping de routes
   ci-dessous complète (et doit rester aligné avec) la navigation de l'app. */

function routeFor(data) {
  if (data.target_type === "message" && data.target_id) {
    return "/messages?c=" + encodeURIComponent(data.target_id);
  }
  if (data.target_type === "content") return "/media";
  if (data.target_type === "community") return "/community";
  // daily_verse, annonce, défaut → accueil
  return "/";
}

self.addEventListener("push", (event) => {
  let data = {};
  const raw = event.data ? event.data.text() : "";
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { body: raw };
  }
  const title = data.title || "ÉGLISE CHAY";
  const url = typeof data.url === "string" && data.url.charAt(0) === "/"
    ? data.url
    : routeFor(data);
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      data: { url },
      tag: data.tag,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = typeof data.url === "string" && data.url.charAt(0) === "/"
    ? data.url
    : "/";
  event.waitUntil(
    (async () => {
      // Une fenêtre de l'app est déjà ouverte : on la focalise et on la fait
      // naviguer (message écouté par l'app côté Layout).
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const w of windows) {
        if (typeof w.focus === "function") {
          w.postMessage({ type: "chay-notification-click", url });
          return w.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })()
  );
});

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);
