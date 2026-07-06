/* personalize.js — window.Personalize: siteyi ?to= URL parametresiyle kişiselleştirir.
   Örn: ...?to=Elif  →  başlık "Elif, benimle çıkar mısın?" + bildirim "Elif ...".
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
    if (to) {
      var nameEl = window.DOM ? DOM.$("ask-name") : document.getElementById("ask-name");
      // Varsayılan span "Benimle"; isim gelince "Elif, benimle" olur (textContent → XSS güvenli)
      if (nameEl) nameEl.textContent = to + ", benimle";
      // bildirim mesajında da bu isim görünsün
      if (window.CONFIG && CONFIG.notify) CONFIG.notify.toName = to;
    }
    // Sekme başlığı: ?to= varsa isimli, yoksa isimsiz
    try {
      document.title = to ? (to + ", Sana Bişi Sorucam 💌") : "Sana Bişi Sorucam 💌";
    } catch (e) {}
  }

  window.Personalize = { apply: apply };
})();
