const CACHE_NAME = "BlamelessV1"; // bump when you change files

const ASSETS = [
  "./",
  "./Blameless.html",          // IMPORTANT: if your entry file is index2.html, change this
  "./styles2.css",
  "./app2.js",
  "./data2.tsv",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./register-sw.js",
  "./service-worker.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // ✅ This makes bookmarks / direct URL opens work offline
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(req))
    );
    return;
  }

  // Cache-first for everything else (js/css/tsv/icons)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
