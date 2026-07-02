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
    // FormData (multipart) = CORS "simple request" → preflight YOK. JSON+Content-Type ise
    // preflight tetikleyip bloklanıyordu. FormData ile istek sunucuya DAİMA teslim edilir
    // (e-posta gider); yanıt ACAO'suz olsa da okumamıza gerek yok (fire-and-forget, .catch).
    if (cfg.web3formsKey) {
      try {
        var fd = new FormData();
        fd.append("access_key", cfg.web3formsKey);
        fd.append("subject", title);
        fd.append("from_name", "Randevu Sitesi 💌");
        fd.append("message", detail + "\n\nSeninle, çok yakında ♡");
        fetch("https://api.web3forms.com/submit", { method: "POST", body: fd }).catch(function () {});
      } catch (e) {}
    }
  }

  window.Notify = { send: send };
})();
