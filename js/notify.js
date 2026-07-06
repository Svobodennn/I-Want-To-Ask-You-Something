/* notify.js — window.Notify: randevu oluşunca (özet ekranı) canlı bildirim tetikler.
   Sırlar (ntfy topic / Web3Forms key) İSTEMCİDE YOK — same-origin /api/notify'a POST
   edilir; sırları Vercel env'den okuyan serverless fonksiyon (api/notify.js) iletir.
   SRP: bildirim tetikleme. Bağımlılıklar: window.AppState, window.CONFIG.notify.
   Not: file:// veya düz statik sunucuda /api yok → istek sessizce düşer (fire-and-forget). */
(function () {
  "use strict";

  function send() {
    var state = window.AppState || {};
    var cfg = (window.CONFIG && CONFIG.notify) || {};
    try {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toName: cfg.toName || "",
          day: state.day || "",
          food: state.food || "",
          drink: state.drink || ""
        })
      }).catch(function () {});
    } catch (e) {}
  }

  window.Notify = { send: send };
})();
