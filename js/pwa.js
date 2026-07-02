/* pwa.js — window.PWA: service worker'ı kaydeder ("ana ekrana ekle" + offline).
   SRP: PWA kaydı. Yalnız güvenli origin'de (HTTPS/localhost) çalışır; file://'de sessiz atlar. */
(function () {
  "use strict";
  function register() {
    if (!("serviceWorker" in navigator)) return;
    // file:// altında SW desteklenmez — sessiz geç
    if (location.protocol === "file:") return;
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  window.PWA = { register: register };
})();
