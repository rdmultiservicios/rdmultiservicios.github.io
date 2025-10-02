self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("tv360-cache").then((cache) => {
      return cache.addAll([
        "index.html",
        "style.css",
        "main.js",
        "manifest.json",
        "canales.m3u",
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
