/* builder.js — window.Builder: "Kendi davetini oluştur" — isimden paylaşılabilir ?to= linki üretir.
   SRP: davet linki oluşturucu. Bağımlılıklar: Toast, Sound (guarded). */
(function () {
  "use strict";

  function buildURL(name) {
    return location.origin + location.pathname + "?to=" + encodeURIComponent(name);
  }

  function init() {
    var toggle = document.getElementById("builder-toggle");
    var panel = document.getElementById("builder-panel");
    var input = document.getElementById("builder-name");
    var copy = document.getElementById("builder-copy");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", function () {
      var closed = panel.hasAttribute("hidden");
      if (closed) {
        panel.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
        if (input) input.focus();
      } else {
        panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    function fallback(url) {
      if (input) { input.value = url; try { input.select(); } catch (e) {} }
      if (window.Toast) Toast.show("Linki kopyala (seçildi) ✍️");
    }

    function doCopy() {
      var name = (input && input.value || "").trim();
      if (!name) { if (input) input.focus(); if (window.Toast) Toast.show("Önce bir isim yaz 🙂"); return; }
      var url = buildURL(name);
      var done = function () {
        if (window.Toast) Toast.show("Davet linkin kopyalandı ♡");
        if (window.Sound) Sound.play("chime");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { fallback(url); });
      } else {
        fallback(url);
      }
    }

    if (copy) copy.addEventListener("click", doCopy);
    if (input) input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); doCopy(); }
    });
  }

  window.Builder = { init: init };
})();
