const CACHE_VERSION = "thabslab-pro-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  // V2.1a : pas de cache personnalisé.
  // Les notifications push seront ajoutées en V2.1b.
});
