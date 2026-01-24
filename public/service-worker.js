const CACHE_VERSION = "v1";
const STATIC_CACHE = `alcohol-tracker-static-${CACHE_VERSION}`;
const BASE_URL = self.registration.scope;

const toBaseUrl = (path) => new URL(path, BASE_URL).toString();

const STATIC_ASSETS = [
  toBaseUrl("./"),
  toBaseUrl("./index.html"),
  toBaseUrl("./styles.css"),
  toBaseUrl("./app.js"),
  toBaseUrl("./supabase-config.js"),
  toBaseUrl("./manifest.webmanifest"),
  toBaseUrl("./icons/icon.svg"),
  toBaseUrl("./icons/icon-maskable.svg"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("alcohol-tracker-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (isSameOrigin && request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(toBaseUrl("./index.html")))
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
