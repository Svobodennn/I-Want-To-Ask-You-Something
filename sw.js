/* sw.js — Service Worker: uygulama kabuğunu önbelleğe alır (offline + "ana ekrana ekle").
   Cache-first strateji. Yalnız HTTPS/localhost'ta çalışır (file:// zaten offline). */
var CACHE = "randevu-v1";
var ASSETS = [
  "./", "index.html", "css/styles.css",
  "js/config.js", "js/state.js", "js/dom.js", "js/personalize.js", "js/toast.js",
  "js/screens.js", "js/radiogroup.js", "js/datepicker.js", "js/ambient.js",
  "js/celebrate.js", "js/calendar.js", "js/ticket.js", "js/notify.js", "js/escape.js",
  "js/date-screen.js", "js/food-screen.js", "js/summary-screen.js", "js/pwa.js", "js/app.js",
  "assets/icon-192.png", "assets/icon-512.png"
];

self.addEventListener("install", function (e) {
  // allSettled: bir dosya eksik olsa bile kurulum başarısız olmasın
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return Promise.allSettled(ASSETS.map(function (a) { return c.add(a); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  // Bildirim istekleri (ntfy/web3forms) asla önbellekten dönmesin
  if (/ntfy\.sh|api\.web3forms\.com/.test(req.url)) return;
  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).catch(function () { return caches.match("index.html"); });
    })
  );
});
