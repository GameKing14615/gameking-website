// Service Worker for Dashy by TNH
// In development mode: bypass cache completely to ensure instant live-reload
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clear all old caches immediately
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Always fetch fresh files directly from the network / server
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
