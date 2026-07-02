/* personalize.js — window.Personalize: siteyi ?to= URL parametresiyle kişiselleştirir.
   Örn: ...?to=Elif  →  başlık "Elif, benimle date'e çıkar mısın?" + bildirim "Elif ...".
   SRP: kişiselleştirme (isim enjeksiyonu). Bağımlılıklar: DOM, CONFIG.notify. XSS-güvenli (textContent). */
(function () {
  "use strict";

  // Güvenli isim: makul uzunluk, tek satır, kenar boşlukları temiz (textContent zaten XSS'i keser).
  function clean(raw) {
    if (!raw) return "";
    var s = String(raw).replace(/[\r\n\t]+/g, " ").trim();
    return s.slice(0, 40);
  }

  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) { return null; }
  }

  function apply() {
    var to = clean(param("to"));
    if (!to) return; // param yoksa varsayılan ("Aslı") kalır
    var nameEl = window.DOM ? DOM.$("ask-name") : document.getElementById("ask-name");
    if (nameEl) nameEl.textContent = to;
    // bildirim mesajında da bu isim görünsün
    if (window.CONFIG && CONFIG.notify) CONFIG.notify.toName = to;
    // sekme başlığı (opsiyonel dokunuş)
    try { document.title = to + ", benimle date'e çıkar mısın? 💌"; } catch (e) {}
  }

  window.Personalize = { apply: apply };
})();
