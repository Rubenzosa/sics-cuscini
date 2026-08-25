// ═══════════════════════════════════════════════════
// SICS Service Worker — PWA offline support
// ═══════════════════════════════════════════════════
const CACHE_NAME = "sics-v3";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/logo78.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
  "/manifest.json",
];

// Installa e pre-cacha gli asset statici
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Attiva e pulisce vecchie cache
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Strategia: Network First, fallback cache
// Per Firebase e API sempre network, per asset statici cache
self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Firebase e API — sempre network, no cache
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("firebase") ||
    url.includes("googleapis.com")
  ) {
    return; // Lascia passare senza intercettare
  }

  // Asset statici — Cache First
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Cacha solo risposte valide
        if (response && response.status === 200 && response.type === "basic") {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Fallback offline per pagine HTML
        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("/index.html");
        }
      });
    })
  );
});