/* notify.js — window.Notify: randevu oluşunca (özet ekranı) canlı bildirim gönderir.
   ntfy.sh (telefon push) + Web3Forms (e-posta). Backend YOK, fire-and-forget.
   SRP: bildirim gönderimi. Bağımlılıklar: window.AppState, window.CONFIG.notify. */
(function () {
  "use strict";

  function send() {
    var state = window.AppState || {};
    var cfg = (window.CONFIG && CONFIG.notify) || {};
    var who = cfg.toName ? (cfg.toName + " ") : "";
    var title = "💌 Randevu oluştu!";
    var detail = who + "randevuyu onayladı 🎉\n" +
      "📅 " + (state.day || "-") + "\n" +
      "🍽️ " + (state.food || "-") + "\n" +
      "🥂 " + (state.drink || "-");

    // 1) ntfy.sh → anında telefon push (basit POST, custom header yok → CORS preflight yok)
    if (cfg.ntfyTopic) {
      try {
        fetch("https://ntfy.sh/" + encodeURIComponent(cfg.ntfyTopic), {
          method: "POST",
          body: title + "\n" + detail
        }).catch(function () {});
      } catch (e) {}
    }

    // 2) Web3Forms → e-posta (access key public-safe; e-posta adresini gizler)
    // Resmi client-side (AJAX) yöntemi. Gerçek domain'de çalışır; localhost'ta CORS'a
    // takılabilir ama fire-and-forget (.catch ile sessiz).
    if (cfg.web3formsKey) {
      try {
        fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            access_key: cfg.web3formsKey,
            subject: title,
            from_name: "Randevu Sitesi 💌",
            message: detail + "\n\nSeninle, çok yakında ♡"
          })
        }).catch(function () {});
      } catch (e) {}
    }
  }

  window.Notify = { send: send };
})();
