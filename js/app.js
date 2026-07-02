/* app.js — Kompozisyon kökü (composition root).
   SRP: modülleri birbirine bağlar, üst-seviye akış geçişlerini yönetir. İş mantığı modüllerde.
   Yükleme sırası index.html'de: temeller → efektler → servisler → controller'lar → app (en son). */
(function () {
  "use strict";

  // Evet (veya kaçan Hayır teslim olunca) → kutlama ekranı
  function goCelebrate() {
    if (window.Escape && typeof Escape.disable === "function") Escape.disable();
    if (window.Celebrate && typeof Celebrate.burst === "function") {
      var c = DOM.centerOf(DOM.$("btn-yes"));
      Celebrate.burst(c.x, c.y);
    }
    Screens.show("screen-celebrate");
  }

  // Baştan Al → tüm state + ekran controller'ları + kaçan buton sıfırla
  function doRestart() {
    if (window.AppState) AppState.reset();
    if (window.DateScreen) DateScreen.reset();
    if (window.FoodScreen) FoodScreen.reset();
    if (window.SummaryScreen) SummaryScreen.reset();
    if (window.Escape && typeof Escape.reset === "function") Escape.reset();
    Screens.show("screen-ask");
  }

  function init() {
    // Kişiselleştirme (?to=İsim) — başlık/bildirim ismini ayarla (varsa)
    if (window.Personalize && typeof Personalize.apply === "function") Personalize.apply();

    // Arkaplan + kaçan Hayır mekaniği
    if (window.Ambient && typeof Ambient.start === "function") Ambient.start();
    if (window.Escape && typeof Escape.init === "function") Escape.init({ onAccept: goCelebrate });

    // Ekran controller'ları (kendi input/enable/kayıtlarını yaparlar)
    if (window.DateScreen) DateScreen.init();
    if (window.FoodScreen) FoodScreen.init();
    if (window.SummaryScreen) SummaryScreen.init();

    // Kutlama ekranı giriş hook'u (yalnız ileri girişte: fıskiye + ambient yoğunluk)
    Screens.onEnter("screen-celebrate", function (opts) {
      if (opts && opts.back) return;
      if (window.Celebrate && typeof Celebrate.fountain === "function") Celebrate.fountain();
      if (window.Ambient && typeof Ambient.intensify === "function") Ambient.intensify(2000);
    });

    // Akış butonları
    var btnYes = DOM.$("btn-yes");
    if (btnYes) btnYes.addEventListener("click", goCelebrate);

    var btnPlan = DOM.$("btn-plan");
    if (btnPlan) btnPlan.addEventListener("click", function () { Screens.show("screen-date"); });

    var btnRestart = DOM.$("btn-restart");
    if (btnRestart) btnRestart.addEventListener("click", doRestart);

    // Easter egg: kutlama başlığına tık → mini patlama
    var celebrateTitle = DOM.$("celebrate-title");
    if (celebrateTitle) {
      celebrateTitle.addEventListener("click", function () {
        if (window.Celebrate && typeof Celebrate.mini === "function") {
          var c = DOM.centerOf(celebrateTitle);
          Celebrate.mini(c.x, c.y);
        }
      });
    }

    // Geri butonları + başlangıç ekranı
    Screens.wireBack();
    Screens.show("screen-ask");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Debug/entegrasyon için ince yüzey
  window.App = { goCelebrate: goCelebrate, restart: doRestart };
})();
