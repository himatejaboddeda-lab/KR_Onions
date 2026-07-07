// ============================================
// KR ONIONS STOCK UPDATE — SERVICE WORKER
// Caches the app shell so the app opens instantly and
// installs like a native app. Live stock data still
// requires an internet connection (Cloudflare Worker API).
// ============================================

const CACHE_NAME = "kr-onions-shell-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manager-branch.html",
  "./manager-product.html",
  "./manager-variety.html",
  "./manager-entry.html",
  "./manager-summary.html",
  "./owner-dashboard.html",
  "./owner-history.html",
  "./css/style.css",
  "./js/config.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // Never intercept calls to the Cloudflare Worker API — those must hit the network.
  if (event.request.url.includes("workers.dev") || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache newly visited same-origin pages for next time offline.
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
