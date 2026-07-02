/* date-screen.js — window.DateScreen: tarih ekranı denetleyicisi.
   Özel tasarım takvim (DatePicker) ile buluşma tarihi seçimi.
   SRP: tarih seçim akışı. Bağımlılıklar: DOM, DatePicker, AppState, Screens. */
(function () {
  "use strict";

  var btnNext, picker;

  function setNextEnabled(on) {
    if (!btnNext) return;
    if (on) { btnNext.removeAttribute("disabled"); btnNext.classList.add("is-armed"); }
    else { btnNext.setAttribute("disabled", ""); btnNext.classList.remove("is-armed"); }
  }

  // Takvimden gün seçildi → state'e yaz + "Devam et" aktifleşsin
  function onSelect(isoStr, display) {
    AppState.dateISO = isoStr;
    AppState.day = display;
    setNextEnabled(true);
  }

  function init() {
    btnNext = DOM.$("btn-date-next");
    var container = DOM.$("date-calendar");
    if (container && window.DatePicker) {
      picker = DatePicker.create(container, { minISO: DOM.todayISO(), onSelect: onSelect });
    }
    setNextEnabled(false);

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        if (btnNext.hasAttribute("disabled")) return;
        Screens.show("screen-food");
      });
    }
  }

  function reset() {
    if (picker) picker.reset();
    setNextEnabled(false);
  }

  window.DateScreen = { init: init, reset: reset };
})();
