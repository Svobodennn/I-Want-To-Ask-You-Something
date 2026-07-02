/* tap-hearts.js — window.TapHearts: ekrana her dokunuşta imleç konumunda minik kalp uçurur.
   SRP: tap-to-heart mikro-etkileşimi. Bağımlılık: Celebrate.tap (guarded). reduced-motion'da kapalı. */
(function () {
  "use strict";
  var last = 0;

  function init() {
    // Hareket azaltma tercihi: dekoratif kalpleri kapat
    if (window.CONFIG && CONFIG.reduced) return;
    document.addEventListener("pointerdown", function (e) {
      var t = (window.performance && performance.now) ? performance.now() : Date.now();
      if (t - last < 90) return; // hızlı ard arda dokunuşları throttle et
      last = t;
      if (window.Celebrate && typeof Celebrate.tap === "function") {
        Celebrate.tap(e.clientX, e.clientY);
      }
    }, { passive: true });
  }

  window.TapHearts = { init: init };
})();
